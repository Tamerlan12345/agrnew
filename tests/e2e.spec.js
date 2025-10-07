const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');

let serverProcess;

// Start the server before all tests and stop it after
test.beforeAll(async () => {
    // The test will run from the root, so the path is correct
    serverProcess = spawn('node', ['server.js']);
    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
    serverProcess.kill();
});

test.describe('Agreement Generator E2E Tests', () => {
    const baseURL = 'http://localhost:3000';

    test('should display the main page and initial elements', async ({ page }) => {
        await page.goto(baseURL);
        await expect(page.locator('h1')).toHaveText('Agreement Generator v6.3');
        await expect(page.locator('#mode-manual')).toBeChecked();
    });

    test('should show AI status as unconfigured', async ({ page }) => {
        await page.goto(baseURL);
        const aiStatusIndicator = page.locator('#ai-status-indicator');
        await expect(aiStatusIndicator).toBeVisible();
        await expect(aiStatusIndicator).toHaveText('AI Сервис Не настроен');
        // Check that the radio button for informational changes is disabled
        await expect(page.locator('#mode-info')).toBeDisabled();
    });

    test.describe('UI sections visibility based on mode selection', () => {
        const modes = [
            { id: '#mode-calc-add', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-increase', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-decrease', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-terminate', calculator: true, change: false, terminate: true, finalData: false, monetary: false, info: false },
            { id: '#mode-manual', calculator: false, change: false, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-info', calculator: false, change: false, terminate: false, finalData: true, monetary: false, info: true, disabled: true }, // Disabled, so we can't click it
        ];

        for (const mode of modes) {
            if (mode.disabled) continue; // Skip the disabled radio button

            test(`should correctly toggle sections for mode: ${mode.id}`, async ({ page }) => {
                await page.goto(baseURL);
                await page.locator(`label[for="${mode.id.substring(1)}"]`).click();

                await expect(page.locator('#calculator-wrapper')).toBeVisible({ visible: mode.calculator });
                await expect(page.locator('#calc-change-section')).toBeVisible({ visible: mode.change });
                await expect(page.locator('#calc-terminate-section')).toBeVisible({ visible: mode.terminate });
                await expect(page.locator('#final-data-wrapper')).toBeVisible({ visible: mode.finalData });
                await expect(page.locator('#monetary-section')).toBeVisible({ visible: mode.monetary });
                await expect(page.locator('#info-section')).toBeVisible({ visible: mode.info });
            });
        }
    });

    test('should perform a premium increase calculation correctly', async ({ page }) => {
        await page.goto(baseURL);

        // 1. Select "Увеличение СС" mode
        await page.locator('label[for="mode-calc-increase"]').click();

        // 2. Fill in the calculator form
        await page.locator('#calc-start-date').fill('01.01.2024');
        await page.locator('#calc-end-date').fill('31.12.2024'); // 366 days in a leap year
        await page.locator('#calc-effective-date').fill('01.07.2024');
        await page.locator('#calc-sum-insured').fill('1 000 000');
        await page.locator('#calc-tariff').fill('5');

        // 3. Click calculate
        await page.locator('#calc-action-button').click();

        // 4. Verify the result
        // Total premium for the year: 1,000,000 * 5% = 50,000
        // Days in year: 366
        // Daily rate: 50,000 / 366 = 136.612...
        // Remaining days (01.07.2024 to 31.12.2024 inclusive): 184
        // Premium delta: 136.612 * 184 = 25,136.61
        const resultDisplay = page.locator('#calc-result-change');
        await expect(resultDisplay).toBeVisible();
        await expect(resultDisplay.locator('p')).toHaveText('Сумма к доплате:');
        await expect(resultDisplay.locator('.amount')).toHaveText('25 136,61 тг');

        // 5. Check if the values were transferred to the final data section
        await expect(page.locator('#sum-delta')).toHaveValue('1 000 000');
        await expect(page.locator('#premium-delta')).toHaveValue('25 136,61');
    });
});