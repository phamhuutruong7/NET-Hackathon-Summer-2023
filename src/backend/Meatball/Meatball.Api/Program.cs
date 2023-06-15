using Meatball.Api.Application;
using Meatball.Api.Application.Abstractions;
using Meatball.Api.Infrastructure;
using Meatball.Api.Infrastructure.Abstractions;
using Meatball.Api.Settings;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddScoped<IOpenWeatherClient, OpenWeatherClient>();
builder.Services.AddScoped<IWeatherRecommendationApplication, WeatherRecommendationApplication>();
builder.Services.Configure<OpenWeatherSettings>(builder.Configuration.GetSection(nameof(OpenWeatherSettings)));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(p => p.AddPolicy("cors", options =>
{
    options.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
}));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("cors");
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();