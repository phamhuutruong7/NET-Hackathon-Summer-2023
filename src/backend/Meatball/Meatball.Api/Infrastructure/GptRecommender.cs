using System.Reflection;

using Meatball.Api.Application.Abstractions;
using Meatball.Api.DTOs;
using Meatball.Api.Settings;

using Microsoft.Extensions.Options;

using OpenAI.Interfaces;
using OpenAI.Managers;
using OpenAI.ObjectModels;
using OpenAI.ObjectModels.RequestModels;

namespace Meatball.Api.Infrastructure;

public class GptRecommender : IRecommender
{
    private RecommenderSettings _options;
    private IOpenAIService _service;

    private string _generalPrompt = "You are a helpful pirate and shall give recommendation based on the weather. Always answer in the style of pirate.";
    private string _searchPrompt;

    public GptRecommender(IOpenAIService service, IOptions<RecommenderSettings> options)
    {
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _service = service ?? throw new ArgumentNullException(nameof(options));

        _searchPrompt = LoadPromptFromAssembly("Prompts/CarryOnPrompt.txt");
    }

    private string LoadPromptFromAssembly(string filename)
    {
        string buildFolderPath = AppDomain.CurrentDomain.BaseDirectory;
        string textFilePath = Path.Combine(buildFolderPath, filename);

        if (!File.Exists(textFilePath))
        {
            throw new FileNotFoundException(textFilePath);
        }

        string prompt = File.ReadAllText(textFilePath);
        return prompt;
    }

    public async Task<string> GetCarryOnRecommendationAsync(WeatherResponseDto weather)
    {
        var completionResult = await _service.ChatCompletion.CreateCompletion(new ChatCompletionCreateRequest
        {
            Messages = new List<ChatMessage>
            {
                ChatMessage.FromSystem(_generalPrompt),
                ChatMessage.FromSystem($"Outside is {weather?.Weather?.FirstOrDefault()?.Description} and it is {weather?.Main?.Temperature} degrees Celsius."),
                ChatMessage.FromUser(_searchPrompt)
            },
            Model = Models.ChatGpt3_5Turbo0301,
            MaxTokens = 768
        });

        if (!completionResult.Successful)
        {
            throw new ArgumentException();
        }

        return completionResult.Choices.First().Message.Content;
    }

    public async Task<string> GetWorkplaceRecommendationAsync(WeatherResponseDto weather)
    {
        var completionResult = await _service.ChatCompletion.CreateCompletion(new ChatCompletionCreateRequest
        {
            Messages = new List<ChatMessage>
            {
                ChatMessage.FromSystem(_generalPrompt),
                ChatMessage.FromUser("Recommend me something to wear.")
            },
            Model = Models.ChatGpt3_5Turbo,
            MaxTokens = 768
        });

        if (!completionResult.Successful)
        {
            throw new ArgumentException();
        }

        return completionResult.Choices.First().Message.Content;
    }

    public async Task<string> GetSummaryAsync() => throw new NotImplementedException();
}
