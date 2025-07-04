import React, { useState, useRef } from 'react';
import { Download, Printer, Grid, Ruler, FileText } from 'lucide-react';

interface Dimensions {
  width: number;
  height: number;
}

interface FractionalInput {
  whole: string;
  numerator: string;
  denominator: string;
}

type InputMode = 'decimal' | 'fraction' | 'metric';

const TemplateGenerator: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [inputMode, setInputMode] = useState<InputMode>('decimal');
  const [widthInput, setWidthInput] = useState<FractionalInput>({ whole: '', numerator: '', denominator: '16' });
  const [heightInput, setHeightInput] = useState<FractionalInput>({ whole: '', numerator: '', denominator: '16' });
  const [decimalWidth, setDecimalWidth] = useState('');
  const [decimalHeight, setDecimalHeight] = useState('');
  const [metricWidth, setMetricWidth] = useState('');
  const [metricHeight, setMetricHeight] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const convertFractionToDecimal = (input: FractionalInput): number => {
    const whole = parseFloat(input.whole) || 0;
    const num = parseFloat(input.numerator) || 0;
    const den = parseFloat(input.denominator) || 1;
    return whole + (num / den);
  };

  const updateDimensions = () => {
    let width = 0;
    let height = 0;

    switch (inputMode) {
      case 'decimal':
        width = parseFloat(decimalWidth) || 0;
        height = parseFloat(decimalHeight) || 0;
        break;
      case 'fraction':
        width = convertFractionToDecimal(widthInput);
        height = convertFractionToDecimal(heightInput);
        break;
      case 'metric':
        width = (parseFloat(metricWidth) || 0) / 25.4; // Convert mm to inches
        height = (parseFloat(metricHeight) || 0) / 25.4;
        break;
    }

    setDimensions({ width, height });
  };

  React.useEffect(() => {
    updateDimensions();
  }, [inputMode, widthInput, heightInput, decimalWidth, decimalHeight, metricWidth, metricHeight]);

  const generateTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (72 DPI for print)
    const dpi = 72;
    const pixelWidth = dimensions.width * dpi;
    const pixelHeight = dimensions.height * dpi;
    const margin = 72; // 1 inch margin for scales and labels

    canvas.width = pixelWidth + margin * 2;
    canvas.height = pixelHeight + margin * 2;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, pixelWidth, pixelHeight);

    // Draw 1-inch grid with shaded lines
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 1; i < dimensions.width; i++) {
      const x = margin + (i * dpi);
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin + pixelHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 1; i < dimensions.height; i++) {
      const y = margin + (i * dpi);
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(margin + pixelWidth, y);
      ctx.stroke();
    }

    // Draw scales
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Top scale (horizontal)
    for (let i = 0; i <= dimensions.width; i++) {
      const x = margin + (i * dpi);
      ctx.fillText(i.toString(), x, margin - 10);
      
      // Tick marks
      ctx.beginPath();
      ctx.moveTo(x, margin - 5);
      ctx.lineTo(x, margin);
      ctx.stroke();
    }

    // Left scale (vertical)
    ctx.textAlign = 'right';
    for (let i = 0; i <= dimensions.height; i++) {
      const y = margin + (i * dpi);
      ctx.fillText(i.toString(), margin - 10, y + 4);
      
      // Tick marks
      ctx.beginPath();
      ctx.moveTo(margin - 5, y);
      ctx.lineTo(margin, y);
      ctx.stroke();
    }

    // Add dimension labels
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    // Right side - height
    ctx.save();
    ctx.translate(margin + pixelWidth + 30, margin + pixelHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${dimensions.height.toFixed(2)}"`, 0, 0);
    ctx.restore();

    // Bottom - width
    ctx.fillText(`${dimensions.width.toFixed(2)}"`, margin + pixelWidth / 2, margin + pixelHeight + 40);

    // Load and draw logo, then add text
    const logo = new Image();
    logo.onload = () => {
      // Draw logo on bottom left
      const logoHeight = 30;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      ctx.drawImage(logo, margin, canvas.height - 50, logoWidth, logoHeight);
      
      // Add text next to logo
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Shadowboard Layout Template', margin + logoWidth + 20, canvas.height - 35);
      
      ctx.font = '12px Arial';
      ctx.fillText('Bespoke', margin + logoWidth + 20, canvas.height - 20);
      ctx.fillText('https://bespoketooltrays.com/', margin + logoWidth + 20, canvas.height - 5);
    };
    
    // Set logo source - this will trigger the onload event
    logo.src = '/50.png';
    
    // Fallback if logo doesn't load - draw text only
    logo.onerror = () => {
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Shadowboard Layout Template', margin, canvas.height - 40);
      
      ctx.font = '12px Arial';
      ctx.fillText('Bespoke', margin, canvas.height - 20);
      ctx.fillText('https://bespoketooltrays.com/', margin + 200, canvas.height - 20);
    };
  };

  React.useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      generateTemplate();
    }
  }, [dimensions]);

  const downloadTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `shadowboard-template-${dimensions.width}x${dimensions.height}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const printTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Shadowboard Template</title>
          <style>
            body { margin: 0; padding: 20px; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; padding: 0; }
              img { width: 100%; height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL()}" alt="Shadowboard Template" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateTiledTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;

    // Standard US Letter size in inches (with margins)
    const pageWidth = 8.5;
    const pageHeight = 11;
    const pageMargin = 0.5; // 0.5 inch margins
    const printableWidth = pageWidth - (pageMargin * 2);
    const printableHeight = pageHeight - (pageMargin * 2);
    
    const dpi = 72;
    const templateMargin = 1; // 1 inch margin for scales and labels
    
    // Calculate total template size including margins
    const totalWidth = dimensions.width + (templateMargin * 2);
    const totalHeight = dimensions.height + (templateMargin * 2);
    
    // Calculate how many pages needed
    const pagesX = Math.ceil(totalWidth / printableWidth);
    const pagesY = Math.ceil(totalHeight / printableHeight);
    
    // Create a new window for the tiled print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <html>
        <head>
          <title>Shadowboard Template - Tiled Print (${pagesX}x${pagesY} pages)</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif;
            }
            .page { 
              width: ${pageWidth}in; 
              height: ${pageHeight}in; 
              margin: 0;
              padding: ${pageMargin}in;
              box-sizing: border-box;
              page-break-after: always;
              position: relative;
              border: 1px solid #ccc;
              margin-bottom: 10px;
            }
            .page:last-child {
              page-break-after: auto;
              margin-bottom: 0;
            }
            .page-info {
              position: absolute;
              top: 5px;
              right: 5px;
              font-size: 10px;
              color: #666;
              background: white;
              padding: 2px 5px;
              border: 1px solid #ccc;
            }
            .assembly-guide {
              margin: 20px;
              padding: 15px;
              border: 2px solid #333;
              background: #f9f9f9;
              page-break-inside: avoid;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(${pagesX}, 1fr);
              gap: 2px;
              margin: 10px 0;
            }
            .grid-cell {
              border: 1px solid #ccc;
              padding: 5px;
              text-align: center;
              font-size: 10px;
              min-height: 20px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .page { 
                margin: 0;
                border: none;
                margin-bottom: 0;
              }
              .assembly-guide {
                margin: 0;
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="assembly-guide">
            <h2>Assembly Instructions</h2>
            <p><strong>Template Size:</strong> ${dimensions.width}" × ${dimensions.height}"</p>
            <p><strong>Pages Required:</strong> ${pagesX} × ${pagesY} = ${pagesX * pagesY} pages</p>
            <p><strong>Instructions:</strong></p>
            <ol>
              <li>Print all ${pagesX * pagesY} pages at 100% scale (no scaling)</li>
              <li>Trim pages along the dotted lines if present</li>
              <li>Arrange pages according to the grid below</li>
              <li>Tape or glue pages together, overlapping edges slightly</li>
              <li>The assembled template will be ${dimensions.width}" × ${dimensions.height}"</li>
            </ol>
            <h3>Page Layout Grid:</h3>
            <div class="grid-container">
    `;

    // Add page layout grid
    for (let row = 0; row < pagesY; row++) {
      for (let col = 0; col < pagesX; col++) {
        const pageNum = (row * pagesX) + col + 1;
        htmlContent += `<div class="grid-cell">Page ${pageNum}<br>Row ${row + 1}, Col ${col + 1}</div>`;
      }
    }

    htmlContent += `
            </div>
          </div>
    `;

    // Generate each page
    for (let row = 0; row < pagesY; row++) {
      for (let col = 0; col < pagesX; col++) {
        const pageNum = (row * pagesX) + col + 1;
        
        // Create a canvas for this page section
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        if (!pageCtx) continue;

        // Set page canvas size
        pageCanvas.width = printableWidth * dpi;
        pageCanvas.height = printableHeight * dpi;

        // Clear canvas
        pageCtx.fillStyle = 'white';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Calculate the section of the main template to draw
        const sectionX = col * printableWidth;
        const sectionY = row * printableHeight;

        // Draw the section from the main canvas
        const mainCanvas = canvasRef.current;
        if (mainCanvas) {
          pageCtx.drawImage(
            mainCanvas,
            sectionX * dpi, sectionY * dpi, // Source position
            printableWidth * dpi, printableHeight * dpi, // Source size
            0, 0, // Destination position
            printableWidth * dpi, printableHeight * dpi // Destination size
          );
        }

        // Add page to HTML
        htmlContent += `
          <div class="page">
            <div class="page-info">Page ${pageNum} of ${pagesX * pagesY}<br>Row ${row + 1}, Col ${col + 1}</div>
            <img src="${pageCanvas.toDataURL()}" style="width: 100%; height: auto;" alt="Template Page ${pageNum}" />
          </div>
        `;
      }
    }

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const renderInputFields = () => {
    switch (inputMode) {
      case 'decimal':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (inches)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={decimalWidth}
                onChange={(e) => setDecimalWidth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (inches)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={decimalHeight}
                onChange={(e) => setDecimalHeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter height"
              />
            </div>
          </div>
        );

      case 'fraction':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (inches)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={widthInput.whole}
                  onChange={(e) => setWidthInput({ ...widthInput, whole: e.target.value })}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={widthInput.numerator}
                  onChange={(e) => setWidthInput({ ...widthInput, numerator: e.target.value })}
                  className="w-12 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <span className="text-lg">/</span>
                <select
                  value={widthInput.denominator}
                  onChange={(e) => setWidthInput({ ...widthInput, denominator: e.target.value })}
                  className="w-12 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="16">16</option>
                  <option value="8">8</option>
                  <option value="4">4</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (inches)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={heightInput.whole}
                  onChange={(e) => setHeightInput({ ...heightInput, whole: e.target.value })}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={heightInput.numerator}
                  onChange={(e) => setHeightInput({ ...heightInput, numerator: e.target.value })}
                  className="w-12 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <span className="text-lg">/</span>
                <select
                  value={heightInput.denominator}
                  onChange={(e) => setHeightInput({ ...heightInput, denominator: e.target.value })}
                  className="w-12 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="16">16</option>
                  <option value="8">8</option>
                  <option value="4">4</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'metric':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={metricWidth}
                onChange={(e) => setMetricWidth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={metricHeight}
                onChange={(e) => setMetricHeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter height"
              />
            </div>
          </div>
        );
    }
  };

  // Calculate if tiled printing is needed
  const needsTiling = dimensions.width > 6.5 || dimensions.height > 8.5;
  const tiledPages = needsTiling ? 
    Math.ceil((dimensions.width + 2) / 7.5) * Math.ceil((dimensions.height + 2) / 9.5) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/50.png" alt="Bespoke Industrial Group" className="h-12 mr-4" />
            <h1 className="text-3xl font-bold text-gray-800">
              Shadowboard Layout Template Generator
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create custom shadowboard templates for your tools and equipment. 
            Measure your storage area and generate a precise grid template for printing.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel - Smaller */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center mb-4">
              <Ruler className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Template Dimensions</h2>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
              <h3 className="font-medium text-blue-800 mb-1 text-sm">Instructions:</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Measure your storage area to the nearest 1/16"</li>
                <li>• Enter the width and height dimensions</li>
                <li>• Choose your preferred input method below</li>
                <li>• Download or print the generated template</li>
              </ul>
            </div>

            {/* Input Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement Input Method
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setInputMode('decimal')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'decimal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Decimal
                </button>
                <button
                  onClick={() => setInputMode('fraction')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'fraction'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fraction
                </button>
                <button
                  onClick={() => setInputMode('metric')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'metric'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Metric
                </button>
              </div>
            </div>

            {/* Input Fields */}
            {renderInputFields()}

            {/* Current Dimensions Display */}
            {dimensions.width > 0 && dimensions.height > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-1 text-sm">Template Size:</h3>
                <p className="text-green-700 text-sm">
                  {dimensions.width.toFixed(2)}" × {dimensions.height.toFixed(2)}"
                  {inputMode === 'metric' && (
                    <span className="text-xs ml-2">
                      ({(dimensions.width * 25.4).toFixed(1)}mm × {(dimensions.height * 25.4).toFixed(1)}mm)
                    </span>
                  )}
                </p>
                {needsTiling && (
                  <p className="text-orange-700 text-xs mt-1">
                    ⚠️ Large template - will require {tiledPages} pages when tiled
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {dimensions.width > 0 && dimensions.height > 0 && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={downloadTemplate}
                  className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
                <button
                  onClick={printTemplate}
                  className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Single Page
                </button>
                <button
                  onClick={generateTiledTemplate}
                  className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Tiled Pages
                  {needsTiling && <span className="ml-1 text-xs">({tiledPages} pages)</span>}
                </button>
              </div>
            )}

            {/* Tiling Information */}
            {needsTiling && dimensions.width > 0 && dimensions.height > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-1 text-sm">Tiled Printing Info:</h3>
                <p className="text-orange-700 text-xs">
                  This template is larger than a standard 8.5×11" page. Use "Print Tiled Pages" 
                  to break it into {tiledPages} printable pages with assembly instructions.
                </p>
              </div>
            )}
          </div>

          {/* Preview Panel - Larger */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Grid className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Template Preview</h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
              {dimensions.width > 0 && dimensions.height > 0 ? (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full border border-gray-300 rounded"
                  style={{ 
                    width: 'auto', 
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '600px'
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Grid className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Enter dimensions to see template preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">
            © 2025 Bespoke - Professional Tool Organization Solutions
          </p>
          <p className="text-sm">
            Visit us at{' '}
            <a 
              href="https://bespoketooltrays.com/" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://bespoketooltrays.com/
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateGenerator;