using System.Net;

namespace LearnMS.API.Common.ImgBb;

public static class ImgBbImageProxy
{
    private static readonly HashSet<string> AllowedHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "i.ibb.co",
        "ibb.co",
        "thumb.ibb.co",
        "image.ibb.co",
        "i.ibb.co.com",
        "ibb.co.com"
    };

    public static bool TryCreateAllowedUri(string? url, out Uri uri)
    {
        uri = null!;
        if (string.IsNullOrWhiteSpace(url))
            return false;

        var trimmed = url.Trim();
        if (trimmed.StartsWith("//", StringComparison.Ordinal))
            trimmed = "https:" + trimmed;

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var parsed))
            return false;

        if (parsed.Scheme != Uri.UriSchemeHttps)
            return false;

        if (!string.IsNullOrEmpty(parsed.UserInfo))
            return false;

        var host = parsed.IdnHost;
        if (string.IsNullOrWhiteSpace(host) || IPAddress.TryParse(host, out _))
            return false;

        if (IsAllowedHost(host))
        {
            uri = parsed;
            return true;
        }

        return false;
    }

    public static bool IsAllowedHost(string host) =>
        AllowedHosts.Contains(host)
        || host.EndsWith(".ibb.co", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith(".ibb.co.com", StringComparison.OrdinalIgnoreCase);
}
