import { toast } from 'react-hot-toast';

/**
 * Fetches printer settings from the backend.
 * This is a mock function. Replace with your actual API call.
 * @param outletId The ID of the outlet.
 * @param printType The type of print ('KOT' or 'BILL').
 * @returns The name of the printer.
 */
async function getPrinterForOutlet(outletId: number, printType: 'KOT' | 'BILL'): Promise<string | null> {
    // In a real app, you would fetch this from your backend.
    // Example: GET /api/settings/printer-setting?outletId=${outletId}&type=${printType}
    // The backend would return { printerName: 'POS-80C' }

    // For demonstration, we'll use mock settings.
    console.log(`Fetching printer for Outlet ID: ${outletId}, Type: ${printType}`);
    if (printType === 'KOT') {
        // Replace with your actual KOT printer name saved in settings
        return 'POS-80C'; 
    }
    if (printType === 'BILL') {
        // Replace with your actual BILL printer name saved in settings
        return 'Microsoft Print to PDF'; 
    }
    return null;
}

/**
 * A universal function to handle direct, silent printing in Electron.
 * @param printType - The type of document to print ('KOT' or 'BILL').
 * @param contentHtml - The raw HTML string of the content to be printed.
 * @param outletId - The ID of the current outlet to fetch settings for.
 */
export async function printDirect(
    printType: 'KOT' | 'BILL',
    contentHtml: string,
    outletId: number
): Promise<void> {
    try {
        if (!window.electronAPI) {
            toast.error('Printing API is not available. This feature works only in the Electron app.');
            return;
        }

        // 1. Get the designated printer name from your settings
        const designatedPrinterName = await getPrinterForOutlet(outletId, printType);
        if (!designatedPrinterName) {
            toast.error(`No printer configured for ${printType} printing in this outlet's settings.`);
            return;
        }

        // 2. Get all available system printers
        const availablePrinters = await window.electronAPI.getInstalledPrinters();
        const printerExists = availablePrinters.some(p => p.name === designatedPrinterName);

        if (!printerExists) {
            toast.error(`Printer "${designatedPrinterName}" not found on this system. Please check printer settings or install the printer.`);
            return;
        }

        // 3. Send print job to the specific printer
        await window.electronAPI.printToSpecificPrinter(designatedPrinterName, contentHtml);
        toast.success(`${printType} sent to printer: ${designatedPrinterName}`);

    } catch (error: any) {
        console.error(`Failed to print ${printType}:`, error);
        toast.error(`Printing failed: ${error.message || 'Unknown error'}`);
    }
}