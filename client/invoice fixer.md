
## 1. Issue Description
The PDF generation for invoices is producing files with significant layout clipping on both the left and right margins. Critical information is being cropped out of the viewport, making the document unprofessional and difficult to read. The layout appears to be overflowing the standard page width (A4/Letter).

## 2. Steps to Reproduce
1.  Navigate to the Admin/Invoicing module.
2.  [cite_start]Locate the specific record for **Invoice #CMD-582D4F9B** dated **25/12/2025**[cite: 7, 8].
    * [cite_start]*Client/Company:* Wahat Alrajaa Tour[cite: 1, 10].
    * [cite_start]*Total Amount:* 329 000,00 DZD[cite: 19].
3.  Click "Download PDF" or "Print Invoice".
4.  Observe that the content on the edges is cut off.

## 3. Expected Behavior
* The entire invoice layout should fit within the printable margins of an A4 page.
* No text, table borders, or logos should be cropped.
* The layout should be responsive to the page size or scaled down to fit `width: 100%`.

## 4. Technical Investigation Areas
Please investigate the following areas in the codebase:

### Frontend / CSS (Stylesheets)
* **Print Media Queries:** Check `@media print` rules. Ensure the main container does not have a fixed pixel width (e.g., `width: 1200px`) that exceeds printable boundaries (~794px for A4 at 96dpi).
* **Margins/Padding:** Verify `body` or `.container` margins aren't pushing content off-canvas.
* **Overflow:** Check for `overflow: hidden` on the main wrapper which might be masking the overflow rather than resizing it.

### Backend / PDF Engine (e.g., Puppeteer, wkhtmltopdf, jsPDF)
* **Viewport Configuration:** Ensure the viewport size passed to the renderer matches the paper format (e.g., A4).
* **Scale Factor:** Check if the render `scale` property is set > 1 or if `fitToPage` is disabled.
* **Margins:** Verify the PDF generator's margin settings aren't conflicting with the CSS margins.

## 5. Acceptance Criteria
* [ ] Invoice #CMD-582D4F9B generates cleanly with zero cropping.
* [ ] Margins are symmetrical and presentable.
* [ ] The fix applies to all invoices using this template.