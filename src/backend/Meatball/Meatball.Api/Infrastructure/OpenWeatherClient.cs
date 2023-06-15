using System.Text.Json;

using Meatball.Api.DTOs;
using Meatball.Api.Infrastructure.Abstractions;
using Meatball.Api.Settings;

using Microsoft.Extensions.Options;

namespace Meatball.Api.Infrastructure;

public class OpenWeatherClient: IOpenWeatherClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenWeatherSettings _settings;

    public OpenWeatherClient(IHttpClientFactory httpClientFactory, IOptions<OpenWeatherSettings> settings)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
    }

    public async Task<WeatherResponseDto?> GetWeather(string zip, CancellationToken cancellationToken)
    {
        HttpClient? client = _httpClientFactory.CreateClient();
        client.BaseAddress = _settings?.BaseUrl is not null ? new Uri(_settings.BaseUrl) : null; 

        HttpResponseMessage response = await client.GetAsync($"weather?q={zip},{_settings?.DefaultCountryCode}&units={_settings?.Units}&appid={_settings?.ApiKey}", cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        return await response.Content.ReadFromJsonAsync<WeatherResponseDto>(options: null, cancellationToken);
    }
}
