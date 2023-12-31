﻿using Meatball.Api.Application.Abstractions;
using Meatball.Api.DTOs;
using Meatball.Api.Infrastructure.Abstractions;

namespace Meatball.Api.Application;

public class WeatherRecommendationApplication: IWeatherRecommendationApplication
{
    private readonly IOpenWeatherClient _openWeatherClient;
    private readonly IRecommender _recommender;

    public WeatherRecommendationApplication(IOpenWeatherClient openWeatherClient, IRecommender recommender)
    {
        _openWeatherClient = openWeatherClient;
        _recommender = recommender;
    }

    public async Task<List<string>> GetRecommendations(string zip, CancellationToken cancellationToken)
    {
        WeatherResponseDto? weather = await _openWeatherClient.GetWeather(zip, cancellationToken);
        if (weather is null)
        {
            return new List<string> { "No recommendations for you, sorry." };
        }

        var recommendationsString = await _recommender.GetCarryOnRecommendationAsync(weather);
        var recommendations = recommendationsString.Split("\n\n");

        return recommendations.ToList();
    }
}
