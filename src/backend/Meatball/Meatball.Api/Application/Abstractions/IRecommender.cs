using Meatball.Api.DTOs;

namespace Meatball.Api.Application.Abstractions;

public interface IRecommender
{
    Task<string> GetWorkplaceRecommendationAsync(WeatherResponseDto weather);

    Task<string> GetCarryOnRecommendationAsync(WeatherResponseDto weather);
}
