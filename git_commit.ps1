param(
    [Parameter(Mandatory=$true)]
    [string]$message
)

if ([string]::IsNullOrEmpty($message)) {
    Write-Host "커밋 메시지를 입력해주세요."
    Write-Host "사용법: .\git_commit.ps1 '커밋 메시지'"
    exit 1
}

git add .
git status
git commit -m $message
git push origin main -u

Write-Host "깃 커밋 및 푸시 완료!" 