using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Edutrack.Models;
using Microsoft.AspNetCore.DataProtection;

namespace Edutrack.Services;

public class PasswordResetMail(
    IDataProtectionProvider protection,
    IWebHostEnvironment environment,
    IConfiguration configuration,
    ILogger<PasswordResetMail> logger)
{
    private readonly ITimeLimitedDataProtector protector =
        protection.CreateProtector("EduTrack.PasswordReset.v1").ToTimeLimitedDataProtector();

    public bool Enabled => environment.IsDevelopment() &&
        configuration.GetValue<bool>("PasswordReset:UseLocalMailpit");

    private sealed record ResetAccount(string Email, string PasswordFingerprint);

    private static string Fingerprint(User user) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(user.Password)));

    public (string Email, string Fingerprint)? Read(string token)
    {
        if (!Enabled) return null;
        try
        {
            var account = JsonSerializer.Deserialize<ResetAccount>(protector.Unprotect(token));
            return account is null ? null : (account.Email, account.PasswordFingerprint);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    public bool Matches(User user, string fingerprint) => Fingerprint(user) == fingerprint;

    public async Task SendAsync(User user)
    {
        var token = protector.Protect(
            JsonSerializer.Serialize(new ResetAccount(user.Email, Fingerprint(user))),
            TimeSpan.FromMinutes(15));
        var frontend = configuration["PasswordReset:FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontend.TrimEnd('/')}/forgot-password#token={Uri.EscapeDataString(token)}";
        using var message = new MailMessage("noreply@edutrack.test", user.Email,
            "Reset your EduTrack password", $"Open this link within 15 minutes:\n\n{link}");
        using var smtp = new SmtpClient("127.0.0.1", 1025);
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await smtp.SendMailAsync(message, timeout.Token);
            logger.LogInformation("Password reset email accepted by Mailpit on 127.0.0.1:1025.");
        }
        catch (Exception ex) when (ex is SmtpException or OperationCanceledException)
        {
            logger.LogWarning("Password reset email failed on 127.0.0.1:1025 ({ErrorType}).", ex.GetType().Name);
        }
    }
}
