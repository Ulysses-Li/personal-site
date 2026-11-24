# 個人標誌 PNG 匯出｜直接讀取 SVG 原稿的底色及多邊形，不另存第二份座標。
# Windows 內建 System.Drawing，不需安裝圖片套件。
# 執行：powershell -NoProfile -ExecutionPolicy Bypass -File scripts/export-brand-icons.ps1
param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$brandDirectory = Join-Path $ProjectRoot 'dist/assets/brand'
$sourcePath = Join-Path $brandDirectory 'louis-li-mark.svg'
[xml]$source = [System.IO.File]::ReadAllText($sourcePath)
$background = $source.SelectSingleNode("//*[local-name()='rect']")
$polygons = $source.SelectNodes("//*[local-name()='polygon']")
if ($source.DocumentElement.viewBox -ne '0 0 512 512' -or $polygons.Count -ne 2) {
  throw 'SVG 需保留 512 座標、單一底色及兩個 polygon；變更構圖類型時請一併調整匯出器。'
}
$backgroundColor = [System.Drawing.ColorTranslator]::FromHtml($background.fill)

# 四倍取樣後縮小，讓 16／32px 斜切角也有平滑邊緣。
foreach ($size in @(16, 32, 180, 192, 512, 1024)) {
  $scale = 4
  $canvasSize = $size * $scale
  $canvas = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $output = $null
  $resizer = $null
  try {
    $graphics.Clear($backgroundColor)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($canvasSize / 512.0), ($canvasSize / 512.0))
    foreach ($polygon in $polygons) {
      [System.Drawing.PointF[]]$points = @($polygon.points.Trim() -split '\s+' | ForEach-Object {
        $coordinates = $_ -split ','
        [System.Drawing.PointF]::new([single]::Parse($coordinates[0], [cultureinfo]::InvariantCulture), [single]::Parse($coordinates[1], [cultureinfo]::InvariantCulture))
      })
      $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($polygon.fill))
      try { $graphics.FillPolygon($brush, $points) } finally { $brush.Dispose() }
    }
    $output = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $resizer = [System.Drawing.Graphics]::FromImage($output)
    $resizer.Clear($backgroundColor)
    $resizer.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $resizer.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $resizer.DrawImage($canvas, [System.Drawing.Rectangle]::new(0, 0, $size, $size), 0, 0, $canvasSize, $canvasSize, [System.Drawing.GraphicsUnit]::Pixel)
    $targetPath = Join-Path $brandDirectory "louis-li-icon-$size.png"
    $output.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "已輸出 $size x $size PNG"
  } finally {
    if ($null -ne $resizer) { $resizer.Dispose() }
    if ($null -ne $output) { $output.Dispose() }
    $graphics.Dispose()
    $canvas.Dispose()
  }
}
