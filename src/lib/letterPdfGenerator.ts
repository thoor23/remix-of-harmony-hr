import jsPDF from "jspdf";

export function generateLetterPDF(htmlContent: string, filename: string): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Create a temporary div to parse HTML and extract text
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Simple text extraction with basic formatting
  const textContent = tempDiv.innerText || tempDiv.textContent || "";
  const lines = textContent.split("\n").filter(line => line.trim());

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  const lineHeight = 7;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Check if we need a new page
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Simple formatting detection
    const isHeading = trimmedLine.length < 50 && trimmedLine === trimmedLine.toUpperCase();
    const isBold = tempDiv.querySelector(`*:contains("${trimmedLine}")`);

    if (isHeading) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    }

    // Word wrap
    const splitLines = doc.splitTextToSize(trimmedLine, maxWidth);
    splitLines.forEach((splitLine: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(splitLine, margin, yPosition);
      yPosition += lineHeight;
    });

    // Add extra spacing after headings
    if (isHeading) {
      yPosition += 3;
    }
  });

  doc.save(filename);
}

export function printLetter(htmlContent: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print the letter");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Letter</title>
      <style>
        @media print {
          body { margin: 0; padding: 20mm; }
        }
        body { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
