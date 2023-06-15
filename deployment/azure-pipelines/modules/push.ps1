param (
    [Parameter(Mandatory)][String]$AcrUrl,
    [Parameter(Mandatory)][String]$AppName,
    [Parameter(Mandatory)][String]$AppVersion
)

Write-Host "+++ Start push.ps1"

$acrName       = $AcrUrl.Split('.')[0]
$image         = "$AppName`:$AppVersion"
$imageFullName = "$AcrUrl/$image"

Write-Host "Push to URL $AcrUrl"
Write-Host "ACR Name $acrName"
Write-Host "Image $imageFullName"

az --version --only-show-errors
az account show --only-show-errors
az acr login --name $acrName --only-show-errors

docker tag $image $imageFullName
docker push $imageFullName
