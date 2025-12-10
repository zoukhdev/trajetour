Wahat Alrajaa TMS - Mobile UI/RTL Fix Implementation Prompt
Goal
Resolve the two critical UI/UX issues present in the Wahat Alrajaa Tour Management System APK: (1) Header/Sidebar overlap due to incorrect safe area handling, and (2) Sidebar position reverting after a link click when the language is set to Arabic (RTL).

I. Layout Fix: Header/Sidebar Overlap and Hidden Content
Problem: The top bar (header) and parts of the bottom-left sidebar are hidden or overlap the content. This is typically caused by failing to account for the mobile device's Status Bar and device notches (the "safe area").

Action: Ensure that all root-level containers respect the device's safe area.

Required Changes (Client Frontend)
Install/Verify Safe Area Context:

Ensure the dependency react-native-safe-area-context is installed and properly configured.

Apply Safe Area View:

Locate the root component that wraps the main navigation or content of the app (e.g., [client/src/App.tsx] or [client/src/components/Layout.tsx]).

Wrap the entire application structure (where the main header and sidebar are rendered) with the SafeAreaView component.

Example Code Snippet:

JavaScript

import { SafeAreaView } from 'react-native-safe-area-context';
// ... other imports

const MainLayout = ({ children }) => {
    return (
        // Use flex-1 to ensure it covers the full screen area
        <SafeAreaView className="flex-1">
            {/* Your existing Header/Sidebar/Content structure */}
            {children}
        </SafeAreaView>
    );
};
Check for Hardcoded Margins/Paddings:

Review the main content container and header components for hardcoded padding-top or margin-top values (e.g., pt-16). These should be removed or adjusted, as SafeAreaView handles the required spacing automatically.

II. RTL Fix: Dynamic Sidebar Shifting
Problem: When the language is changed to Arabic (RTL), the sidebar moves to the right, but clicking a link causes it to snap back to the left (LTR). This happens because the React Native layout engine requires a full application restart to fully apply the I18nManager.forceRTL() command.

Action: Implement a full application restart upon language change, and ensure the sidebar's position is conditionally set.

Required Changes (Client Frontend)
Install/Verify Restart Library:

Ensure a library like react-native-restart (often used as RNRestart) is installed to allow for a programmatic app reload.

Update Language Switching Logic:

Locate the utility function or context method responsible for changing the language (e.g., handleLanguageSwitch in [client/src/context/LocalizationContext.tsx] or similar).

Modify the function to call I18nManager.forceRTL() and then force a full native restart.

Example Code Snippet (Conceptual):

TypeScript

import { I18nManager } from 'react-native';
import RNRestart from 'react-native-restart'; // Ensure this is imported

const changeLanguageAndRestart = async (newLanguage: string) => {
    const isRTL = newLanguage === 'ar';

    // 1. Save the new language (using AsyncStorage or similar)
    await AsyncStorage.setItem('appLanguage', newLanguage);

    // 2. Apply RTL/LTR setting
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTL);

        // 3. CRITICAL: Restart the application for layout changes to take full effect
        RNRestart.Restart(); 
    }

    // If the direction is already correct, just set the language state
    i18n.changeLanguage(newLanguage);
};
Conditional Sidebar Position (If using a Drawer/Side Navigator):

Ensure the configuration for your main navigator (which renders the sidebar) is setting the drawer position based on the current RTL status, preventing the snap-back effect after navigation.

Example Code Snippet (Conceptual):

TypeScript

// In your main Navigator config file
import { I18nManager } from 'react-native';

// ... inside the Drawer Navigator configuration
const navigatorConfig = {
    // ... other options
    drawerPosition: I18nManager.isRTL ? 'right' : 'left',
};
III. Development Notes
Testing: Thoroughly test the fixed APK on both RTL (Arabic) and LTR (English) device settings.

Security: This implementation only focuses on UI/layout. Ensure all previous security settings, including the authentication system, remain intact or are correctly restored after these UI changes.

Dependencies: Confirm react-native-safe-area-context and react-native-restart (or equivalent) are listed and installed.

Output Requirement: Provide the necessary code logic updates (pseudocode/snippets) for the SafeAreaView implementation, the complete LanguageSwitch function logic using I18nManager and RNRestart, and confirmation of conditional sidebar position logic.