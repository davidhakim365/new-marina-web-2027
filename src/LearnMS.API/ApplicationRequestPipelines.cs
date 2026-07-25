using LearnMS.API.Common.StorageService;
using LearnMS.API.ThirdParties.VdoCipher;
using Serilog;

namespace LearnMS.API;

public static class ApplicationRequestPipelines
{
    public static void UseApplicationRequestPipelines(this WebApplication app)
    {
        app.UseSerilogRequestLogging();
        app.UseSecurityHeaders();
        app.UseHttpsRedirection();
        app.UseExceptionHandler(opt => { });
        UseSwaggerIfDevelopment(app);
        app.UseAssets();
        app.MapVideoUploadEndpoints();
        UseAuth(app);
        app.MapControllers();
        app.UseStorageService();
        MapSpaClient(app);
    }

    /// <summary>
    /// Lightweight browser hardening headers (clickjacking, MIME sniffing, etc.).
    /// CSP allows self + known embeds used by the SPA (YouTube, imgbb, Google Fonts).
    /// </summary>
    private static void UseSecurityHeaders(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";

            // Baseline CSP — keep in sync with SPA embeds (YouTube, VdoCipher, imgbb, fonts).
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "base-uri 'self'; " +
                "object-src 'none'; " +
                "frame-ancestors 'none'; " +
                "form-action 'self'; " +
                "img-src 'self' data: blob: https://i.ibb.co https://i.ytimg.com https://placehold.co https://*.googleusercontent.com; " +
                "media-src 'self' blob:; " +
                "font-src 'self' data: https://fonts.gstatic.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "script-src 'self' 'unsafe-inline'; " +
                "connect-src 'self' https:; " +
                "frame-src 'self' blob: https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vdocipher.com;";

            await next();
        });
    }

    private static void UseAuth(WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
    }

    private static void MapSpaClient(WebApplication app)
    {
        app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments("/api"), x =>
        {
            x.UseSpaStaticFiles();
            x.UseStaticFiles();
            x.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";
                if (app.Environment.IsDevelopment())
                {
                    spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
                }
            });
        });
    }

    private static void UseSwaggerIfDevelopment(WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
    }
}
