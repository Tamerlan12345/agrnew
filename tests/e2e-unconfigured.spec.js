const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');

const baseURL = 'http://localhost:3000';

test.describe('Agreement Generator E2E Tests - AI Unconfigured', () => {
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
        await expect(page.locator('#mode-info')).toBeDisabled();
    });

    test.describe('UI sections visibility based on mode selection', () => {
        const modes = [
            { id: '#mode-calc-add', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-increase', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-decrease', calculator: true, change: true, terminate: false, finalData: true, monetary: true, info: false },
            { id: '#mode-calc-terminate', calculator: true, change: false, terminate: true, finalData: false, monetary: false, info: false },
            { id: '#mode-manual', calculator: false, change: false, terminate: false, finalData: true, monetary: true, info: false },
        ];

        for (const mode of modes) {
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
        await page.locator('label[for="mode-calc-increase"]').click();
        await page.locator('#calc-start-date').fill('01.01.2024');
        await page.locator('#calc-end-date').fill('31.12.2024');
        await page.locator('#calc-effective-date').fill('01.07.2024');
        await page.locator('#calc-sum-insured').fill('1 000 000');
        await page.locator('#calc-tariff').fill('5');
        await page.locator('#calc-action-button').click();
        const resultDisplay = page.locator('#calc-result-change');
        await expect(resultDisplay).toBeVisible();
        await expect(resultDisplay.locator('p')).toHaveText('Сумма к доплате:');
        await expect(resultDisplay.locator('.amount')).toHaveText('25 136,61 тг');
        await expect(page.locator('#sum-delta')).toHaveValue('1 000 000');
        await expect(page.locator('#premium-delta')).toHaveValue('25 136,61');
    });
});