# fix-responsive.ps1 — Run from project root
# Usage: powershell -ExecutionPolicy Bypass -File fix-responsive.ps1

$files = @(
  "src/app/(dashboard)/member/dashboard/page.tsx",
  "src/app/(dashboard)/member/profile/page.tsx",
  "src/app/(dashboard)/member/delegations/page.tsx",
  "src/app/(dashboard)/member/giveaway/page.tsx",
  "src/app/(dashboard)/member/history/page.tsx",
  "src/app/(dashboard)/member/lottery/page.tsx",
  "src/app/(dashboard)/member/proposals/page.tsx",
  "src/app/(dashboard)/member/vote/page.tsx",
  "src/app/(dashboard)/admin/dashboard/page.tsx",
  "src/app/(dashboard)/admin/alerts/page.tsx",
  "src/app/(dashboard)/admin/analytics/page.tsx",
  "src/app/(dashboard)/admin/audit/page.tsx",
  "src/app/(dashboard)/admin/logs/page.tsx",
  "src/app/(dashboard)/admin/members/page.tsx",
  "src/app/(dashboard)/admin/multisig/page.tsx",
  "src/app/(dashboard)/admin/proposals/page.tsx",
  "src/app/(dashboard)/admin/snapshots/page.tsx",
  "src/app/(dashboard)/admin/timelock/page.tsx",
  "src/app/(dashboard)/council/dashboard/page.tsx",
  "src/app/(dashboard)/council/delegation/page.tsx",
  "src/app/(dashboard)/council/election/page.tsx",
  "src/app/(dashboard)/council/giveaway/page.tsx",
  "src/app/(dashboard)/council/lottery/page.tsx",
  "src/app/(dashboard)/council/proposals/page.tsx",
  "src/app/(dashboard)/council/reputation/page.tsx",
  "src/app/(dashboard)/council/rules/page.tsx",
  "src/app/(dashboard)/council/voting/page.tsx"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "FIX: $file" -ForegroundColor Green
    $content = Get-Content $file -Raw

    # grid-cols-4 → grid-cols-2 lg:grid-cols-4
    $content = $content -replace 'grid grid-cols-4 gap', 'grid grid-cols-2 lg:grid-cols-4 gap'

    # grid-cols-5 → grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
    $content = $content -replace 'grid grid-cols-5 gap', 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap'

    # grid-cols-3 → grid-cols-1 sm:grid-cols-3
    $content = $content -replace 'grid grid-cols-3 gap', 'grid grid-cols-1 sm:grid-cols-3 gap'

    # grid-cols-2 → grid-cols-1 md:grid-cols-2 (only non-responsive ones)
    $content = $content -replace 'grid grid-cols-2 gap', 'grid grid-cols-1 md:grid-cols-2 gap'

    # Tables: wrap in overflow-x-auto
    $content = $content -replace '<table className="w-full text-left">', '<div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]">'
    $content = $content -replace '</table>\s*</div>\s*</DashboardLayout>', '</table></div></div></DashboardLayout>'

    # Card overflow
    $content = $content -replace 'className="card overflow-hidden"', 'className="card overflow-x-auto"'

    # Filter buttons: add flex-wrap
    $content = $content -replace '"flex gap-2 mb-5"', '"flex flex-wrap gap-2 mb-5"'
    $content = $content -replace '"flex gap-1 bg-gray-100', '"flex flex-wrap gap-1 bg-gray-100'

    # Council proposals: side-by-side → stack on mobile
    $content = $content -replace '"flex gap-4">\s*<div className="flex-1">', '"flex flex-col lg:flex-row gap-4"><div className="flex-1">'
    $content = $content -replace '"w-\[340px\] card', '"w-full lg:w-[340px] card'

    # Alert action buttons: stack on mobile
    $content = $content -replace '"flex gap-2 shrink-0"', '"flex flex-col sm:flex-row gap-2 shrink-0"'

    # Giveaway/Lottery event cards: stack on mobile
    $content = $content -replace '"flex justify-between items-start">', '"flex flex-col sm:flex-row justify-between items-start gap-3">'

    # Multisig council grid
    $content = $content -replace '"flex gap-1\.5 mb-3"', '"grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3"'

    # Save bar responsive
    $content = $content -replace '"sticky bottom-0 bg-white border-t border-thin border-gray-200 px-5 py-3 flex justify-between items-center', '"sticky bottom-0 bg-white border-t border-thin border-gray-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-2'

    # Checkboxes row: wrap on mobile
    $content = $content -replace '"flex gap-6 mb-4 text-xs"', '"flex flex-wrap gap-4 sm:gap-6 mb-4 text-xs"'

    Set-Content $file $content -NoNewline
    Write-Host "  Done" -ForegroundColor DarkGray
  } else {
    Write-Host "SKIP: $file not found" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "All pages updated for mobile responsiveness!" -ForegroundColor Cyan
Write-Host "Run 'npm run dev' and test with Chrome DevTools (Ctrl+Shift+M)" -ForegroundColor DarkGray
