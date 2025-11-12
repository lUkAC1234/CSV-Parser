import json
from import_export import resources
from import_export import fields as ie_fields
from django.conf import settings

def _safe_setattr(o, n, v):
    try:
        setattr(o, n, v)
    except Exception:
        pass


def _set_on_instance_with_language(i, lang, p):
    if not p:
        return
    try:
        i.set_current_language(lang)
    except Exception:
        pass
    for k, v in p.items():
        _safe_setattr(i, k, v or "")
    try:
        i.save()
    except Exception:
        pass


def _upsert_translation(i, lang, p):
    if not p:
        return
    mgr = getattr(i, "translations", None)
    if mgr is None:
        _set_on_instance_with_language(i, lang, p)
        return
    ex = None
    try:
        ex = mgr.filter(language_code=lang).first()
    except Exception:
        ex = None
    if ex:
        for k, v in p.items():
            _safe_setattr(ex, k, v or "")
        try:
            ex.save()
            return
        except Exception:
            pass
    try:
        mgr.create(**{**p, "language_code": lang})
        return
    except Exception:
        _set_on_instance_with_language(i, lang, p)
        return

class TranslatableResource(resources.ModelResource):
    translations = ie_fields.Field(column_name="translations", attribute=None)
    alternate_key = "link"
    TRANSLATION_FIELDS = ()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._translations_map = {}
        try:
            self._languages = [c for c, _ in getattr(settings, "LANGUAGES", [("en", "English")])]
        except Exception:
            self._languages = ["en"]

    def _get(self, row, key):
        try:
            return row.get(key) if hasattr(row, "get") else getattr(row, key, None)
        except Exception:
            return None

    def get_translations_dict(self, obj, fields):
        out = {}
        mgr = getattr(obj, "translations", None)

        if mgr is not None:
            try:
                items = list(mgr.all())
            except Exception:
                items = []
            if items:
                for tr in items:
                    lang = getattr(tr, "language_code", None) or getattr(tr, "language", None)
                    if not lang:
                        continue
                    data = {f: getattr(tr, f, "") or "" for f in fields}
                    out[lang] = data
                if out:
                    return out

        for lang in self._languages:
            data = {}
            any_present = False
            for f in fields:
                try:
                    val = obj.safe_translation_getter(f, language_code=lang, any_language=False)
                except TypeError:
                    try:
                        val = obj.safe_translation_getter(f, any_language=False)
                    except Exception:
                        val = None
                except Exception:
                    val = None
                if val is None:
                    val = ""
                if val != "":
                    any_present = True
                data[f] = val or ""
            if any_present:
                out[lang] = data
        return out
    def import_row(self, row, instance_loader, **kwargs):
        raw = self._get(row, "translations")
        parsed = {}
        if raw:
            if isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = {}
            elif isinstance(raw, dict):
                parsed = raw
        key = None
        rid = self._get(row, "id") or self._get(row, "pk")
        if rid:
            key = str(rid)
        else:
            alt = self._get(row, self.alternate_key)
            if alt:
                key = str(alt)
        if key and parsed:
            self._translations_map[key] = parsed
        return super().import_row(row, instance_loader, **kwargs)

    def after_save_instance(self, instance, *args, **kwargs):
        dry = bool(kwargs.get("dry_run", False))
        if not dry and len(args) >= 2:
            try:
                dry = bool(args[1])
            except Exception:
                pass
        if dry:
            return
        pk = getattr(instance, "pk", None)
        alt = getattr(instance, self.alternate_key, None)
        key = str(pk) if pk else (str(alt) if alt else "")
        translations = self._translations_map.pop(key, None)
        if not translations and alt:
            translations = self._translations_map.pop(str(alt), None)
        if not translations:
            return
        for lang, payload in translations.items():
            try:
                self.apply_translation(instance, lang, payload)
            except Exception:
                continue

    def apply_translation(self, instance, lang_code, payload):
        raise NotImplementedError
