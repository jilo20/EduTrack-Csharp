using Edutrack.Data;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddControllers();

builder.Services.AddOpenApi();
builder.Services.AddValidation();
builder.AddEduTrackDb();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.MigrateDb();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
