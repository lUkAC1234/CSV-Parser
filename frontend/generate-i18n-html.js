import fs from "fs";
import path from "path";

const languages = {
    en: {
        lang: "en",
        locale: "en_US",
        title: "",
        ogTitle: "",
        ogSiteName: "",
        description:
            "",
        ogDescription:
            "",
        keywords:
            "",
    },
    ru: {
        lang: "ru",
        locale: "ru_RU",
        title: "",
        ogTitle: "",
        ogSiteName: "",
        description:
            "",
        ogDescription:
            "",
        keywords:
            "",
    },
    uz: {
        lang: "uz",
        locale: "uz_UZ",
        title: "",
        ogTitle: "",
        ogSiteName: "",
        description:
            "",
        ogDescription:
            "",
        keywords:
            "",
    },
};

const buildDir = "build";
const originalHtmlPath = path.join(buildDir, "index.html");
const siteBaseUrl = "https://futbolive.uz";

function escapeJsonString(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

try {
    if (!fs.existsSync(originalHtmlPath)) throw new Error(`Original index.html not found at ${originalHtmlPath}`);
    let html = fs.readFileSync(originalHtmlPath, "utf8");

    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
    html = html.replace(/<link\s+rel=["']alternate["'][^>]*>\s*/gi, "");
    html = html.replace(
        /<meta[^>]*(name|property)=["'](description|keywords|twitter:[^'"]+|og:[^'"]+|msapplication-TileColor|msapplication-TileImage|theme-color)["'][^>]*>\s*/gi,
        "",
    );
    html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "");
    html = html.replace(/<script[^>]*src=["'][^"']*googletagmanager[^"']*["'][\s\S]*?<\/script>\s*/gi, "");
    html = html.replace(/<script[^>]*>\s*window\.dataLayer[\s\S]*?<\/script>\s*/gi, "");
    html = html.replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<script>[\s\S]*?<\/script>\s*/gi, "");
    html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>\s*/gi, "");
    html = html.replace(/<link[^>]*rel=["']mask-icon["'][^>]*>\s*/gi, "");
    html = html.replace(/<link[^>]*rel=["']apple-touch-icon[-\w]*["'][^>]*>\s*/gi, "");
    html = html.replace(/<meta[^>]*name=["']author['"][^>]*>\s*/gi, "");

    html = html.replace(/<html\s+lang=['"][^'"]*['"]>/i, '<html lang="__LANG__">');
    html = html.replace(/<title>[^<]*<\/title>/i, "<title>__TITLE__</title>");
    if (!/__SEO_TAGS__/.test(html)) html = html.replace(/<\/head>/i, "__SEO_TAGS__\n</head>");

    const seoFolder = path.join(buildDir, "seo");
    fs.mkdirSync(seoFolder, { recursive: true });

    for (const [langCode, data] of Object.entries(languages)) {
        const siteUrl = `${siteBaseUrl}/${langCode}/`;
        let hreflangs = `<link rel="canonical" href="${siteUrl}">\n`;
        for (const altCode of Object.keys(languages)) {
            hreflangs += `<link rel="alternate" hreflang="${altCode}" href="${siteBaseUrl}/${altCode}/">\n`;
        }
        hreflangs += `<link rel="alternate" hreflang="x-default" href="${siteBaseUrl}/">\n`;

        const seoTags = `
${hreflangs}
<meta name="description" content="${escapeHtml(data.description)}">
<meta name="keywords" content="${escapeHtml(data.keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:title" content="${escapeHtml(data.ogTitle)}">
<meta property="og:site_name" content="${escapeHtml(data.ogSiteName)}">
<meta property="og:description" content="${escapeHtml(data.ogDescription)}">
<meta property="og:url" content="${siteUrl}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${data.locale}">
<meta property="og:image" content="${siteBaseUrl}/websiteImage.png">
<meta property="og:image:secure_url" content="${siteBaseUrl}/websiteImage.png">
<meta property="og:image:width" content="780">
<meta property="og:image:height" content="477">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(data.ogTitle)}">
<meta name="twitter:description" content="${escapeHtml(data.ogDescription)}">
<meta name="twitter:url" content="${siteUrl}">
<meta name="twitter:image" content="${siteBaseUrl}/websiteImage.png">
<meta name="msapplication-TileColor" content="#32b846">
<meta name="msapplication-TileImage" content="/favicon.svg">
<meta name="theme-color" content="#000000">
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="mask-icon" href="/favicon.svg" color="#32b846">
<link rel="apple-touch-icon-precomposed" href="/faviconCompressed.webp">
<link rel="apple-touch-icon" sizes="144x144" href="/favicon.svg">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Fotball",
  "url": "${siteUrl}",
  "logo": "${siteBaseUrl}/favicon.svg",
  "sameAs": ["https://t.me/lUkACENkO1"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "${siteUrl}",
  "name": "${escapeJsonString(data.title)}",
  "description": "${escapeJsonString(data.description)}"
}
</script>
<style>body { background-color: #000000; }</style>
`;

        const content = html
            .replace(/__LANG__/g, data.lang)
            .replace(/__TITLE__/g, data.title)
            .replace("__SEO_TAGS__", seoTags);

        const outputPath = path.join(seoFolder, `${langCode}.html`);
        fs.writeFileSync(outputPath, content, "utf8");
        console.log(`✅ Generated: ${path.relative(process.cwd(), outputPath)}`);
    }

    console.log("\n🎉 SEO HTML files generated successfully in /build/seo");
} catch (err) {
    console.error("❌ SEO generation failed:", err);
}
