# PowerShell script to add catalog sections to all template preview files
# This script adds catalog placeholder content to template preview files

$templateDir = "templates"
$previewFiles = Get-ChildItem -Path $templateDir -Name "*-preview.html"

# Files that already have catalog sections (skip these)
$completedFiles = @(
    "classic-preview.html",
    "glassmorphism-preview.html", 
    "purplecard-preview.html",
    "neoncard-preview.html",
    "techwave-preview.html",
    "coverstory-preview.html"
)

# Generic catalog HTML content to insert
$catalogContent = @"

            <!-- Catalog Section -->
            <div class="catalog-section">
                <h3 class="catalog-title">Products</h3>
                <div class="catalog-grid">
                    <div class="catalog-item">
                        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop" alt="Product 1" class="catalog-item-image">
                        <div class="catalog-item-content">
                            <h4 class="catalog-item-title">Premium Course</h4>
                            <p class="catalog-item-description">Learn advanced techniques and skills</p>
                            <div class="catalog-item-price">`$99.00</div>
                            <a href="#" target="_blank" class="catalog-buy-btn">
                                <i class="fas fa-shopping-cart"></i> Buy Now
                            </a>
                        </div>
                    </div>
                    <div class="catalog-item">
                        <img src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop" alt="Product 2" class="catalog-item-image">
                        <div class="catalog-item-content">
                            <h4 class="catalog-item-title">Digital Templates</h4>
                            <p class="catalog-item-description">Professional design templates pack</p>
                            <div class="catalog-item-price">`$29.99</div>
                            <a href="#" target="_blank" class="catalog-buy-btn">
                                <i class="fas fa-shopping-cart"></i> Buy Now
                            </a>
                        </div>
                    </div>
                    <div class="catalog-item">
                        <img src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=200&fit=crop" alt="Product 3" class="catalog-item-image">
                        <div class="catalog-item-content">
                            <h4 class="catalog-item-title">Consultation</h4>
                            <p class="catalog-item-description">One-on-one professional consultation</p>
                            <div class="catalog-item-price">`$149.00</div>
                            <a href="#" target="_blank" class="catalog-buy-btn">
                                <i class="fas fa-shopping-cart"></i> Buy Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
"@

foreach ($file in $previewFiles) {
    if ($completedFiles -contains $file) {
        Write-Host "Skipping $file (already completed)" -ForegroundColor Yellow
        continue
    }
    
    $filePath = Join-Path $templateDir $file
    Write-Host "Processing $file..." -ForegroundColor Green
    
    try {
        # Read the file content
        $content = Get-Content $filePath -Raw
        
        # Add catalog CSS if not already present
        if ($content -notmatch 'catalog-styles\.css') {
            $content = $content -replace '(<link rel="stylesheet" href="[^"]+\.css">)', '$1' + "`n    <link rel=`"stylesheet`" href=`"catalog-styles.css`">"
        }
        
        # Find the position to insert catalog content (before Media Content Section)
        if ($content -match '(\s+)<!-- Media Content Section -->') {
            $indent = $matches[1]
            $replacement = $indent + $catalogContent.Trim() + "`n`n" + $indent + "<!-- Media Content Section -->"
            $content = $content -replace '(\s+)<!-- Media Content Section -->', $replacement
            
            # Write the updated content back to file
            Set-Content $filePath $content -NoNewline
            Write-Host "✓ Updated $file" -ForegroundColor Green
        } else {
            Write-Host "✗ Could not find Media Content Section in $file" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ Error processing $file`: $_" -ForegroundColor Red
    }
}

Write-Host "`nScript completed!" -ForegroundColor Cyan
Write-Host "All template preview files should now include catalog sections." -ForegroundColor Cyan
