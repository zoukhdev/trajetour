The Problem
As shown in the attached screenshot, the modal is positioned incorrectly:
* **Vertical Alignment:** The modal is stuck at `top: 0` or is being pushed off-screen at the top.
* **Cropping:** The top labels ("Contact Person" and "Phone") are touching the browser edge or are partially cut off.
* **Layout:** It is not vertically centered within the viewport.

## Requirements for the Fix
Please provide the updated code for the Modal component with the following improvements:

1. **Centering:** Ensure the modal container is perfectly centered both vertically and horizontally (e.g., using `flex items-center justify-center`).
2. **Backdrop:** Verify the background overlay (`fixed inset-0`) covers the entire screen and has an appropriate `z-index` to sit above the sidebar and main content.
3. **Responsiveness:** - Set a `max-height` (e.g., `90vh`) on the modal card.
    - Add `overflow-y-auto` to the modal card so it remains scrollable on smaller screens without the header/footer being cut off.
4. **Spacing:** Ensure there is a minimum margin (e.g., `my-8`) so the modal never touches the absolute top or bottom of the browser window.

## Technical Stack
* **Framework:** React / Tailwind CSS
* **Desired Behavior:** Fixed position overlay with a centered white card.

Please review the existing Modal wrapper and provide the corrected Tailwind classes or CSS.