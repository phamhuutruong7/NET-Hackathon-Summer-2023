﻿using Meatball.Api.Application;
using Meatball.Api.Application.Abstractions;
using Meatball.Api.Infrastructure;
using Meatball.Api.Infrastructure.Abstractions;
using Meatball.Api.Settings;

using OpenAI.Extensions;
using OpenAI.Interfaces;
using OpenAI.ObjectModels;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddOpenAIService();
builder.Services.AddScoped<IOpenWeatherClient, OpenWeatherClient>();
builder.Services.AddScoped<IRecommender, GptRecommender>();
builder.Services.AddScoped<IWeatherRecommendationApplication, WeatherRecommendationApplication>();
builder.Services.Configure<OpenWeatherSettings>(builder.Configuration.GetSection(nameof(OpenWeatherSettings)));
builder.Services.Configure<RecommenderSettings>(builder.Configuration.GetSection(nameof(RecommenderSettings)));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var openAiService = app.Services.GetRequiredService<IOpenAIService>();
openAiService.SetDefaultModelId(Models.ChatGpt3_5Turbo);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
