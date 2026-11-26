using System.Text;
using Edutrack.Data;
using Edutrack.Models;
using Edutrack.Repositories;
using Edutrack.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDataProtection();
builder.Services.AddScoped<PasswordResetMail>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("password-reset", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.AddOpenApi();
builder.Services.AddValidation();
builder.AddEduTrackDb();

// 4.1 / 4.5: JWT login. The frontend sends "Authorization: Bearer <token>" with every request.
// Architecture: Controller -> Service -> Repository.
// Repositories: all database queries and updates (one DbContext per request, committed by the UnitOfWork).
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IInviteRepository, InviteRepository>();
builder.Services.AddScoped<IClassRepository, ClassRepository>();
builder.Services.AddScoped<IAssessmentRepository, AssessmentRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();

// Services: all business rules.
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<GradeService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<InviteService>();
builder.Services.AddScoped<ClassService>();
builder.Services.AddScoped<AssessmentService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<AnnouncementService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped<StudentService>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TokenService.GetKey(builder.Configuration))),
            NameClaimType = TokenService.IdClaim,
            RoleClaimType = TokenService.RoleClaim,   // makes [Authorize(Roles = "Admin")] work
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.MigrateDb();

app.UseHttpsRedirection();
app.UseRouting();
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
