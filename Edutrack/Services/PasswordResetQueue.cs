using System.Threading.Channels;
using Edutrack.Repositories;

namespace Edutrack.Services;

public sealed class PasswordResetQueue(
    IServiceScopeFactory scopes,
    ILogger<PasswordResetQueue> logger) : BackgroundService
{
    private readonly Channel<string> requests = Channel.CreateBounded<string>(
        new BoundedChannelOptions(64) { SingleReader = true });

    public bool TryEnqueue(string email) => requests.Writer.TryWrite(email.Trim().ToLowerInvariant());

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var email in requests.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var mail = scope.ServiceProvider.GetRequiredService<PasswordResetMail>();
                if (!mail.Enabled)
                {
                    logger.LogInformation("Password reset email skipped because local Mailpit is disabled.");
                    continue;
                }

                var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var user = await users.GetByEmailAsync(email);
                if (user?.Status == "active")
                    await mail.SendAsync(user);
                else
                    logger.LogInformation("Password reset email skipped because no active account matched.");
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError("Password reset worker could not process a request ({ErrorType}).", ex.GetType().Name);
            }
        }
    }
}
