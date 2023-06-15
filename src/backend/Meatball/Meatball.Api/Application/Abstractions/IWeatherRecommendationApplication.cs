namespace Meatball.Api.Application.Abstractions;

public interface IWeatherRecommendationApplication
{
    Task<List<string>> GetRecommendations(string zip, CancellationToken cancellationToken);
}
