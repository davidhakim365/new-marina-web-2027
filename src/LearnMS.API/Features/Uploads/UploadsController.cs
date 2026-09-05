using LearnMS.API.Common;
using LearnMS.API.Common.ImgBb;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Uploads;

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController(IImgBbService imgBbService, IHttpClientFactory httpClientFactory)
    : ControllerBase
{
    [HttpPost("imgbb")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses, Permission.ManageLecture, Permission.ManageFiles, Permission.ManageStudentApples, Permission.ManageAppleRewardsStore])]
    public async Task<ApiWrapper.Success<ImgBbUploadResponse>> UploadImgBb(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
            throw new ApiException(new ApiError("Upload.Empty", "File is empty", StatusCodes.Status400BadRequest));

        if (file.Length > 10 * 1024 * 1024)
            throw new ApiException(new ApiError("Upload.TooLarge", "Image must be less than 10MB",
                StatusCodes.Status400BadRequest));

        var url = await imgBbService.UploadAsync(file, ct);
        return new ApiWrapper.Success<ImgBbUploadResponse>
        {
            Data = new ImgBbUploadResponse { Url = url },
            Message = "Image uploaded successfully"
        };
    }

    /// <summary>
    /// Same-origin ImgBB fetch so quiz/exam photos still load on phones that
    /// block i.ibb.co (hotlink/referrer, CSP host mismatch, or mobile ISP).
    /// </summary>
    [HttpGet("image")]
    [AllowAnonymous]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> ProxyImage([FromQuery] string url, CancellationToken ct)
    {
        if (!ImgBbImageProxy.TryCreateAllowedUri(url, out var uri))
            return BadRequest();

        var client = httpClientFactory.CreateClient("ImgBbProxy");
        var current = uri;

        for (var hop = 0; hop < 4; hop++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, current);
            request.Headers.TryAddWithoutValidation("User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36");
            request.Headers.TryAddWithoutValidation("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8");
            request.Headers.Referrer = null;

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            var status = (int)response.StatusCode;

            if (status is >= 300 and < 400)
            {
                var location = response.Headers.Location;
                if (location is null)
                    return StatusCode(status);

                var next = location.IsAbsoluteUri ? location : new Uri(current, location);
                if (!ImgBbImageProxy.TryCreateAllowedUri(next.ToString(), out current))
                    return BadRequest();
                continue;
            }

            if (!response.IsSuccessStatusCode)
                return StatusCode(status);

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
            if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest();

            var bytes = await response.Content.ReadAsByteArrayAsync(ct);
            Response.Headers.CacheControl = "public, max-age=86400";
            return File(bytes, contentType);
        }

        return BadRequest();
    }
}

public sealed class ImgBbUploadResponse
{
    public required string Url { get; set; }
}
