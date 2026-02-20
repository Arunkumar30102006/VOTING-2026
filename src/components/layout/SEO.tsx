import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    type?: string;
    name?: string;
    image?: string;
    schema?: object;
}

export const SEO = ({
    title,
    description,
    canonical,
    type = 'website',
    name = 'Vote India Secure',
    image = '/og-image.png',
    schema
}: SEOProps) => {
    const siteUrl = window.location.origin;
    const canonicalUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title} | Vote India Secure</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={`${siteUrl}${image}`} />
            <meta property="og:site_name" content={name} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@VoteIndiaSecure" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={`${siteUrl}${image}`} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};
