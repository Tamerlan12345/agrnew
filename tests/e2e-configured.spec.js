const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');

const baseURL = 'http://localhost:3000';

test.describe('Agreement Generator E2E Tests - AI Configured', () => {
    test('should show AI status as active and allow informational changes', async ({ page }) => {
        await page.goto(baseURL);
        const aiStatusIndicator = page.locator('#ai-status-indicator');
        await expect(aiStatusIndicator).toBeVisible();
        await expect(aiStatusIndicator).toHaveText('AI Сервис Активен');
        await expect(page.locator('#mode-info')).toBeEnabled();
    });

    test('should process informational text using the AI backend', async ({ page }) => {
        await page.goto(baseURL);
        const mockResponse = 'Стороны договорились считать адрес Страхователя верным в следующей редакции: г. Астана, ул. Достык, д. 1.';
        await page.route('**/api/process-text', async route => {
            await route.fulfill({ json: { processedText: mockResponse } });
        });

        await page.locator('label[for="mode-info"]').click();
        await expect(page.locator('#info-section')).toBeVisible();

        const userInput = 'поменялся адрес страхователя на достык 1';
        await page.locator('#info-general-text').fill(userInput);

        await page.locator('button:has-text("Сгенерировать текст соглашения")').click();

        const resultText = page.locator('#result-text');
        const expectedText = [
            '1. Основанием для заключения настоящего Дополнительного соглашения является письмо Страхователя Вх.№__________ от «__» _______ ____ г..',
            `2. Предметом настоящего Дополнительного соглашения является внесение изменений в Договор добровольного страхования автомобильного транспорта (далее-Договор) № __________ от «__» _______ ____ г..`,
            `3. ${mockResponse}`,
            '4. Настоящее Дополнительное соглашение вступает в силу с даты подписания Сторонами.',
            '5. Остальные пункты и условия Договора, не затронутые настоящим Дополнительным соглашением, остаются неизменными.',
            '6. Настоящее Дополнительное соглашение составлено в двух подлинных экземплярах, имеющих одинаковую юридическую силу.'
        ].join('\n\n');

        await expect(resultText).toHaveValue(expectedText);
        await expect(resultText).not.toHaveValue(new RegExp(userInput));
    });
});