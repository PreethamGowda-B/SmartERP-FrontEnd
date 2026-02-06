import type { Metadata } from "next"

const baseUrl = "https://prozync.in"

export const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            name: "SmartERP",
            url: baseUrl,
            logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/logo.png`,
            },
            sameAs: [],
        },
        {
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            url: baseUrl,
            name: "SmartERP - Crew Management System",
            description: "Professional crew management and ERP system for construction and field services",
            publisher: {
                "@id": `${baseUrl}/#organization`,
            },
            potentialAction: {
                "@type": "SearchAction",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${baseUrl}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "SoftwareApplication",
            name: "SmartERP",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
            },
            description: "Professional crew management and ERP system for construction and field services",
        },
    ],
}

export function StructuredData() {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}
