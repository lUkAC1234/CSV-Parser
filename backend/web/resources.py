# import json
# from common.resources.base import TranslatableResource, _upsert_translation
# from .models import ExampleModel


# class ExampleResource(TranslatableResource):
#     TRANSLATION_FIELDS = ("title",)

#     class Meta:
#         model = ExampleModel
#         fields = (
#             "id",
#             "created_at",
#             "updated_at",
#             "translations",
#         )
#         export_order = fields

#     def dehydrate_translations(self, obj):
#         return json.dumps(self.get_translations_dict(obj, self.TRANSLATION_FIELDS), ensure_ascii=False)

#     def apply_translation(self, instance, lang_code, payload):
#         _upsert_translation(instance, lang_code, payload)
