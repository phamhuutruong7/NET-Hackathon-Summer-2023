$PackageFeedEndpoint = "https://pkgs.dev.azure.com/Af-Appsfactory-Fullstack/Appsfactory-Fullstack-Net-Library/_packaging/AF-Pwsh-Feed/nuget/v2"
$PsRepo              = "AfPwshRepo"
$ResourceName        = "AF-Pulumi"
$UserName            = Read-Host -Prompt "Please enter your user name like <username>@appsfactory.de"
$AccessToken         = Read-Host -Prompt "Please enter your an Azure DevOps Personal Access Token, you will at least need read access to the artifacts of the Library Project (Appsfactory-Fullstack-Net-Library)!"

Write-Host "Create Token"
$patToken = $AccessToken | ConvertTo-SecureString -AsPlainText -Force
$credsAzureDevopsServices = New-Object System.Management.Automation.PSCredential($UserName, $patToken)

# step 1: register the repository
$repository = Get-PSRepository -Name $PsRepo -ErrorAction SilentlyContinue
if($repository) 
{
    Write-Host "Repository already registered." -ForegroundColor Yellow
}
else
{
    try 
    {
        Write-Host "Register Repository $PsRepo..." -NoNewline
        Register-PSRepository -Name $PsRepo -SourceLocation $PackageFeedEndpoint -PublishLocation $PackageFeedEndpoint -InstallationPolicy Trusted -Credential $credsAzureDevopsServices
        Write-Host "done." -ForegroundColor Green    
    }
    catch 
    {
        Write-Error "Unable to register repository $PsRepo."
        Write-Error $_.Exception.Message
    }
}

# step 2: register the package source
$packageSource = Get-PackageSource -Name $PsRepo -ProviderName NuGet -ErrorAction SilentlyContinue
if($packageSource) 
{
    Write-Host "Package Source already registered." -ForegroundColor Yellow
}
else
{
    try 
    {
        Write-Host "Register Package Source..." -NoNewline
        $_ = Register-PackageSource -Name $PsRepo -Location $PackageFeedEndpoint -ProviderName NuGet -Trusted -SkipValidate -Credential $credsAzureDevopsServices
        Write-Host "done." -ForegroundColor Green
    }
    catch {
        Write-Error "Unable to Package Source $PsRepo from location [$PackageFeedEndpoint]."
        Write-Error $_.Exception.Message
    }
}

Write-Host "Get all repositories to see if our new repoistory is registered" -ForegroundColor Yellow
Get-PSRepository | Format-Table

Write-Host "Find all modules to see if we can access our azure feeds" -ForegroundColor Yellow
Find-Module -Repository $PsRepo -Credential $credsAzureDevopsServices | Format-Table

# step 3: install the module
$module = Get-Module -ListAvailable -Name $ResourceName -ErrorAction SilentlyContinue
if($module) 
{
    Write-Host "Module already installed." -ForegroundColor Yellow
}
else
{
    try 
    {
        Write-Host "Install module $ResourceName..." -NoNewline
        Install-Module -Name $ResourceName -Repository $PsRepo -Credential $credsAzureDevopsServices
        Write-Host "done." -ForegroundColor Green
    }
    catch 
    {
        Write-Error "Unable to install module $ResourceName."
        Write-Error $_.Exception.Message
    }
}

Write-Host "Get available modules" -ForegroundColor Yellow
Get-Module -ListAvailable -Name $ResourceName | Format-Table


Write-Host ""
Write-Host "Job Done!" -ForegroundColor Green
