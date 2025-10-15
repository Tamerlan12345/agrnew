// --- ИНИЦИАЛИЗАЦИЯ КАЛЕНДАРЯ И УТИЛИТЫ ---
const datepickerInstances = {};
function initializeDatepickers() {
    const datepickerInputs = document.querySelectorAll('.datepicker-input');
    datepickerInputs.forEach(input => {
        const picker = new Datepicker(input, {
            format: 'dd.mm.yyyy',
            autohide: true,
            language: 'ru',
            buttonClass: 'btn small',
            orientation: 'bottom left'
        });
        datepickerInstances[input.id] = picker;
    });
}
function setCurrentDate(inputId) {
    const picker = datepickerInstances[inputId];
    if (picker) {
        picker.setDate(new Date());
    }
}
document.addEventListener('DOMContentLoaded', initializeDatepickers);

// --- БЛОК КОНВЕРТАЦИИ ЧИСЛА В ПРОПИСЬ ---
function numberToWordsRu(number) {
    const integerPartString = String(number).split(',')[0].replace(/\s/g, '');
    const num = parseInt(integerPartString, 10);

    if (isNaN(num)) return '';
    if (num === 0) return 'ноль';

    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    const thousands = { one: 'тысяча', few: 'тысячи', many: 'тысяч', gender: 'female' };
    const millions = { one: 'миллион', few: 'миллиона', many: 'миллионов', gender: 'male' };
    const billions = { one: 'миллиард', few: 'миллиарда', many: 'миллиардов', gender: 'male' };

    const largeNumberUnits = [null, thousands, millions, billions];

    function getEnding(number, forms) {
        const n = Math.abs(number) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return forms.many;
        if (n1 > 1 && n1 < 5) return forms.few;
        if (n1 === 1) return forms.one;
        return forms.many;
    }

    function convertThreeDigitGroup(groupNum, level) {
        if (groupNum === 0) return '';

        const h = Math.floor(groupNum / 100);
        const t = Math.floor((groupNum % 100) / 10);
        const u = groupNum % 10;
        let words = [];

        if (h > 0) words.push(hundreds[h]);

        if (t === 1) {
            words.push(teens[u]);
        } else {
            if (t > 0) words.push(tens[t]);
            if (u > 0) {
                if (level > 0 && largeNumberUnits[level].gender === 'female') {
                    if (u === 1) words.push('одна');
                    else if (u === 2) words.push('две');
                    else words.push(units[u]);
                } else {
                    words.push(units[u]);
                }
            }
        }

        if (level > 0) {
           words.push(getEnding(groupNum, largeNumberUnits[level]));
        }

        return words.join(' ');
    }

    let n = num;
    let parts = [];
    let level = 0;

    if (n === 0) return 'ноль';

    while (n > 0) {
        const group = n % 1000;
        if (group > 0) {
            parts.unshift(convertThreeDigitGroup(group, level));
        }
        n = Math.floor(n / 1000);
        level++;
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// --- УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ ---
function formatDate(ds) { 
    if (!ds) return '«__» _______ ____ г.'; 
    // Пробуем парсить формат dd.mm.yyyy
    const parts = ds.split('.');
    if (parts.length === 3) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        const m=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
        return `«${d.getDate()}» ${m[d.getMonth()]} ${d.getFullYear()} г.`;
    }
    return '«__» _______ ____ г.';
}
function formatNumberWithSpaces(num) { if (typeof num !=='number') num = parseFloat(String(num).replace(/[\s,]/g, '')); if (isNaN(num)) return '0'; let parts = num.toFixed(2).toString().split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); return parts.join(','); }
function parseFormattedNumber(str) { if (!str) return NaN; return parseFloat(String(str).replace(/\s/g, '').replace(',', '.')); }
function numberInputHandler(event) { const input = event.target; let value = input.value; const rawValue = value.replace(/\s/g, ''); if (/[^0-9.,]/.test(rawValue)) { input.classList.add('input-error'); } else { input.classList.remove('input-error'); } const formattedValue = rawValue.replace(/,/g, '.').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 '); if(input.value !== formattedValue) input.value = formattedValue; }
document.querySelectorAll('.number-input').forEach(input => input.addEventListener('input', numberInputHandler));

// --- ЛОГИКА КАЛЬКУЛЯТОРА ---
function stringToDate(str) { // dd.mm.yyyy to Date object
    const parts = str.split('.');
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    return null;
}
function calculateInclusiveDays(startDateStr, endDateStr) { 
    const sD = stringToDate(startDateStr);
    const eD = stringToDate(endDateStr);
    if (!sD || !eD) return 0; 
    const uSD = Date.UTC(sD.getFullYear(),sD.getMonth(),sD.getDate()); const uED = Date.UTC(eD.getFullYear(),eD.getMonth(),eD.getDate()); if (uSD > uED) return 0; return Math.round((uED - uSD) / (1000*60*60*24)) + 1; 
}
function calculateDaysActiveForTermination(pSDateStr, termDateStr) { 
    const pSD = stringToDate(pSDateStr);
    const tD = stringToDate(termDateStr);
    if (!pSD || !tD) return 0;
    const uPSD = Date.UTC(pSD.getFullYear(),pSD.getMonth(),pSD.getDate()); const uTD = Date.UTC(tD.getFullYear(),tD.getMonth(),tD.getDate()); if (uPSD >= uTD) return 0; return Math.round((uTD - uPSD) / (1000*60*60*24));
}

function runCalculation() {
    const mode = document.querySelector('input[name="main-mode"]:checked').value;
    if (['calc-add', 'calc-increase', 'calc-decrease'].includes(mode)) {
        calculateChange();
    } else if (mode === 'calc-terminate') {
        calculateTerminate();
    }
}

function calculateChange() {
    const mode = document.querySelector('input[name="main-mode"]:checked').value;
    const sDate = document.getElementById('calc-start-date').value;
    const eDate = document.getElementById('calc-end-date').value;
    const effDate = document.getElementById('calc-effective-date').value;
    const sumIns = parseFormattedNumber(document.getElementById('calc-sum-insured').value);
    const tariff = parseFloat(document.getElementById('calc-tariff').value);
    
    if (!sDate || !eDate || !effDate || isNaN(sumIns) || sumIns <= 0 || isNaN(tariff) || tariff <= 0) { alert("Ошибка: Заполните все поля калькулятора корректными, положительными значениями."); return; }
    const tariffPeriod = calculateInclusiveDays(sDate, eDate);
    const remDays = calculateInclusiveDays(effDate, eDate);
    if (tariffPeriod <= 0 || remDays <= 0) { alert("Ошибка: Проверьте правильность дат. Период расчета не может быть отрицательным."); return; }
    
    const premForTariffPeriod = sumIns * (tariff / 100);
    const dailyRate = premForTariffPeriod / tariffPeriod;
    const finalPremiumDelta = dailyRate * remDays;

    const isDecrease = mode === 'calc-decrease';
    const resultTitle = isDecrease ? "Сумма к возврату:" : "Сумма к доплате:";
    const resultDivClass = isDecrease ? "calc-result-display decrease" : "calc-result-display increase";

    const tooltipDetails = [
        { label: "Сумма для расчета", value: formatNumberWithSpaces(sumIns) + " тг", formula: "Введено" },
        { label: "Тариф", value: tariff + "%", formula: "Введено" },
        { label: "Период тарифа (срок полиса)", value: tariffPeriod + " дн.", formula: `(${eDate} - ${sDate}) + 1` },
        { label: "Премия за период тарифа", value: formatNumberWithSpaces(premForTariffPeriod) + " тг", formula: `Сумма * (Тариф / 100)` },
        { label: "Дневная ставка", value: formatNumberWithSpaces(dailyRate.toFixed(4)) + " тг", formula: `Премия / Период тарифа` },
        { label: "Дни для расчета", value: remDays + " дн.", formula: `(${effDate} - ${eDate}) + 1` },
        { label: isDecrease ? "Возврат" : "Доплата", value: formatNumberWithSpaces(finalPremiumDelta) + " тг", formula: `Дн. ставка * Дни для расчета` }
    ];
    
    const resultDiv = document.getElementById('calc-result-change');
    resultDiv.className = resultDivClass;
    resultDiv.innerHTML = `<p>${resultTitle}</p><span class="amount">${formatNumberWithSpaces(finalPremiumDelta)} тг</span>`;
    resultDiv.querySelector('.amount').dataset.tooltipDetails = JSON.stringify(tooltipDetails);
    resultDiv.style.display = 'block';
    attachTooltipEventsToElement(resultDiv.querySelector('.amount'));
    
    document.getElementById('sum-delta').value = document.getElementById('calc-sum-insured').value;
    document.getElementById('premium-delta').value = formatNumberWithSpaces(finalPremiumDelta);
    document.getElementById(isDecrease ? 'sum-decrease' : 'sum-increase').checked = true;
    calculateManualTotals();
}

function calculateTerminate() {
    const sDate = document.getElementById('term-start-date').value;
    const eDate = document.getElementById('term-end-date').value;
    const termDate = document.getElementById('term-effective-date').value;
    const totalPrem = parseFormattedNumber(document.getElementById('term-total-premium').value);
    const rvdPerc = parseFloat(document.getElementById('term-rvd').value);

    if (!sDate || !eDate || !termDate || isNaN(totalPrem) || totalPrem <= 0 || isNaN(rvdPerc) || rvdPerc < 0) { alert("Ошибка: Заполните все поля калькулятора корректными, положительными значениями."); return; }
    
    const totalDays = calculateInclusiveDays(sDate, eDate);
    if (totalDays <= 0) { alert("Ошибка: Общий срок действия полиса не может быть нулевым или отрицательным."); return; }
    let activeDays = calculateDaysActiveForTermination(sDate, termDate);
    if (stringToDate(termDate) > stringToDate(eDate)) { activeDays = totalDays; }

    const premPerDay = totalPrem / totalDays;
    const premActive = (activeDays > 0) ? (premPerDay * activeDays) : 0;
    const rvdAmount = totalPrem * (rvdPerc / 100);
    let calculatedValue = totalPrem - premActive - rvdAmount;

    let resultLabel = (calculatedValue < 0) ? "Задолженность:" : "Сумма к возврату:";
    let finalAmount = Math.abs(calculatedValue);

     const tooltipDetails = [
        { label: "Общая премия", value: formatNumberWithSpaces(totalPrem) + " тг", formula: "Введено" },
        { label: "РВД", value: rvdPerc + "%", formula: "Введено" },
        { label: "Общий срок полиса", value: totalDays + " дн.", formula: `(${eDate} - ${sDate}) + 1` },
        { label: "Факт. срок действия", value: activeDays + " дн.", formula: `(${termDate} - ${sDate})` },
        { label: "Премия за факт. срок", value: formatNumberWithSpaces(premActive) + " тг", formula: `(Общая премия / Общий срок) * Факт. срок` },
        { label: "Удержание РВД", value: formatNumberWithSpaces(rvdAmount) + " тг", formula: `Общая премия * (РВД% / 100)` },
        { label: (calculatedValue < 0) ? "Задолженность" : "Возврат", value: formatNumberWithSpaces(finalAmount) + " тг", formula: `Общая премия - Премия за факт. срок - Удержание РВД` }
    ];

    const resultDiv = document.getElementById('calc-result-terminate');
    resultDiv.className = "calc-result-display decrease";
    resultDiv.innerHTML = `<p>${resultLabel}</p><span class="amount">${formatNumberWithSpaces(finalAmount)} тг</span>`;
    resultDiv.querySelector('.amount').dataset.tooltipDetails = JSON.stringify(tooltipDetails);
    resultDiv.style.display = 'block';
    attachTooltipEventsToElement(resultDiv.querySelector('.amount'));

    // Все еще записываем в скрытое поле для функции генерации текста
    document.getElementById('premium-delta').value = formatNumberWithSpaces(finalAmount);
}


// --- ЛОГИКА ИНТЕРФЕЙСА (UI) ---
function switchMainMode(mode) {
    const isCalcMode = mode.startsWith('calc-');
    document.getElementById('calculator-wrapper').classList.toggle('visible', isCalcMode);
    
    const isChangeCalc = ['calc-add', 'calc-increase', 'calc-decrease'].includes(mode);
    document.getElementById('calc-change-section').classList.toggle('visible', isChangeCalc);
    document.getElementById('calc-terminate-section').classList.toggle('visible', mode === 'calc-terminate');
    
    // Прячем или показываем итоговый блок
    document.getElementById('final-data-wrapper').classList.toggle('visible', mode !== 'calc-terminate');
    
    // Управление содержимым итогового блока
    document.getElementById('monetary-section').classList.toggle('visible', mode !== 'info');
    document.getElementById('info-section').classList.toggle('visible', mode === 'info');
    
    // Разблокируем/блокируем переключатели
    const increaseRadio = document.getElementById('sum-increase');
    const decreaseRadio = document.getElementById('sum-decrease');
    increaseRadio.disabled = false;
    decreaseRadio.disabled = false;

    if (mode === 'calc-add' || mode === 'calc-increase') {
        increaseRadio.checked = true;
        decreaseRadio.disabled = true;
    } else if (mode === 'calc-decrease') {
        decreaseRadio.checked = true;
        increaseRadio.disabled = true;
    }

    if (isChangeCalc) {
        let btnText = 'Рассчитать'; let sumLabel = 'Страховая сумма'; let dateLabel = 'Дата изменения';
        if (mode === 'calc-add') { btnText = 'Рассчитать доплату'; sumLabel = 'СС нового ТС'; dateLabel = 'Дата добавления ТС'; }
        if (mode === 'calc-increase') { btnText = 'Рассчитать доплату'; sumLabel = 'Сумма увеличения СС'; dateLabel = 'Дата увеличения СС'; }
        if (mode === 'calc-decrease') { btnText = 'Рассчитать возврат'; sumLabel = 'Сумма уменьшения СС'; dateLabel = 'Дата уменьшения СС'; }
        document.getElementById('calc-action-button').textContent = btnText;
        document.getElementById('calc-sum-insured-label').textContent = sumLabel;
        document.getElementById('calc-effective-date-label').textContent = dateLabel;
    }
}
document.querySelectorAll('input[name="main-mode"]').forEach(r => r.addEventListener('change', e => switchMainMode(e.target.value)));

function calculateManualTotals() {
    const parse = (id) => parseFormattedNumber(document.getElementById(id).value) || 0;
    const type = document.querySelector('input[name="sum-change-type"]:checked').value;
    ['sum', 'premium'].forEach(prefix => {
        const initial = parse(`${prefix}-initial`);
        const delta = parse(`${prefix}-delta`);
        const total = (type === 'увеличилась') ? initial + delta : initial - delta;
        document.getElementById(`${prefix}-total`).value = total > 0 ? formatNumberWithSpaces(total) : '0,00';
    });
}
document.querySelectorAll('.calc-trigger').forEach(el => el.addEventListener('input', calculateManualTotals));

// --- ЛОГИКА ПОДСКАЗОК ---
const tooltipElement = document.getElementById('calculationTooltip');
function showTooltip(event) { const detailsString = event.target.dataset.tooltipDetails; if (!detailsString) return; try { const details = JSON.parse(detailsString); let html = '<h4>Детализация расчета:</h4>'; details.forEach(step => { html += `<p><strong>${step.label}:</strong> ${step.value} <span class="formula">${step.formula || ''}</span></p>`; }); tooltipElement.innerHTML = html; tooltipElement.classList.remove('hidden'); moveTooltip(event); } catch (e) { console.error("Ошибка тултипа:", e); } }
function hideTooltip() { tooltipElement.classList.add('hidden'); }
function moveTooltip(event) { if (tooltipElement.classList.contains('hidden')) return; let x = event.clientX + 20, y = event.clientY + 20; if (x + tooltipElement.offsetWidth > window.innerWidth) { x = event.clientX - tooltipElement.offsetWidth - 20; } if (y + tooltipElement.offsetHeight > window.innerHeight) { y = event.clientY - tooltipElement.offsetHeight - 20; } tooltipElement.style.left = `${x}px`; tooltipElement.style.top = `${y}px`; }
function attachTooltipEventsToElement(element) { if (element) { element.removeEventListener('mouseenter', showTooltip); element.removeEventListener('mouseleave', hideTooltip); element.removeEventListener('mousemove', moveTooltip); element.addEventListener('mouseenter', showTooltip); element.addEventListener('mouseleave', hideTooltip); element.addEventListener('mousemove', moveTooltip); } }

// --- ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ТЕКСТА ---
async function generateText() { // <--- СДЕЛАТЬ ФУНКЦИЮ АСИНХРОННОЙ
    if (document.querySelectorAll('.input-error').length > 0) {
        alert('ОШИБКА: Проверьте ввод сумм.');
        return;
    }
    
    let textParts = [], itemCounter = 1;
    const mainMode = document.querySelector('input[name="main-mode"]:checked').value;

    const getVal = id => document.getElementById(id).value || '__________';
    const contractNum = getVal('main-contract-number');
    const contractDate = formatDate(getVal('main-contract-date'));
    const insuranceType = getVal('insurance-type');
    const baseDoc = getVal('base-document');
    const inNum = getVal('incoming-doc-number');
    const inDate = formatDate(getVal('incoming-doc-date'));

    textParts.push(`${itemCounter++}. Основанием для заключения настоящего Дополнительного соглашения является ${baseDoc} Вх.№${inNum} от ${inDate}.`);
    textParts.push(`${itemCounter++}. Предметом настоящего Дополнительного соглашения является внесение изменений в Договор ${insuranceType} (далее-Договор) № ${contractNum} от ${contractDate}.`);
    
    if (mainMode === 'info') {
        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        const userInput = getVal('info-general-text');
        if (userInput.trim() !== '') {
            try {
                // Показываем индикатор загрузки (опционально, но рекомендуется)
                document.getElementById('result-text').value = 'Идет обработка текста с помощью ИИ...';

                const processedText = await processInformationalTextAI(userInput); // Вызываем новую AI функцию
                textParts.push(`${itemCounter++}. ${processedText}`);
            } catch (error) {
                console.error("Ошибка обработки ИИ:", error);
                alert("Не удалось обработать текст с помощью ИИ. Проверьте консоль.");
                // В случае ошибки можно вставить исходный текст
                textParts.push(`${itemCounter++}. ${userInput}`);
            }
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    } else {
        const changeType = document.querySelector('input[name="sum-change-type"]:checked').value;
        if (mainMode === 'calc-terminate') {
            textParts.push(`${itemCounter++}. Стороны договорились расторгнуть Договор страхования с ${formatDate(getVal('term-effective-date'))}.`);
            const refundAmount = getVal('premium-delta');
            if(parseFormattedNumber(refundAmount) > 0) {
                 textParts.push(`${itemCounter++}. Страховщик производит возврат части страховой премии в размере ${refundAmount} (${numberToWordsRu(refundAmount)}) тенге.`);
            }
        } else {
            let monetaryChanges = [];
            if (parseFormattedNumber(getVal('sum-delta')) > 0) {
                const sumDelta = getVal('sum-delta'), sumTotal = getVal('sum-total');
                monetaryChanges.push(`«Страховая сумма» ${changeType} на ${sumDelta} (${numberToWordsRu(sumDelta)}) тенге и составляет ${sumTotal} (${numberToWordsRu(sumTotal)}) тенге.`);
            }
            if (parseFormattedNumber(getVal('premium-delta')) > 0) {
                 const premiumDelta = getVal('premium-delta'), premiumTotal = getVal('premium-total');
                 monetaryChanges.push(`«Страховая премия» ${changeType} на ${premiumDelta} (${numberToWordsRu(premiumDelta)}) тенге и составляет ${premiumTotal} (${numberToWordsRu(premiumTotal)}) тенге.`);
            }
            if (monetaryChanges.length > 0) {
                textParts.push(`${itemCounter++}. Стороны договорились внести изменения в следующие графы договора и изложить их в новой редакции:\n${monetaryChanges.join('\n')}`);
            }
        }
        
        const paymentDueDate = document.getElementById('payment-due-date').value;
        if (parseFormattedNumber(getVal('premium-delta')) > 0 && paymentDueDate) {
            let actionText = changeType === 'увеличилась' ? `доплата страховой премии Страхователем` : `возврат части страховой премии Страховщиком`;
            textParts.push(`${itemCounter++}. Предусмотрена ${actionText} в срок до ${formatDate(paymentDueDate)}.`);
        }
    }
    
    textParts.push(`${itemCounter++}. Настоящее Дополнительное соглашение вступает в силу с даты подписания Сторонами.`);
    textParts.push(`${itemCounter++}. Остальные пункты и условия Договора, не затронутые настоящим Дополнительным соглашением, остаются неизменными.`);
    textParts.push(`${itemCounter++}. Настоящее Дополнительное соглашение составлено в двух подлинных экземплярах, имеющих одинаковую юридическую силу.`);

    document.getElementById('result-text').value = textParts.join('\n\n');
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ВЫЗОВА ИИ ---
async function processInformationalTextAI(userInput) {
    // Этот URL указывает на наш собственный бэкенд-сервис.
    // Используем относительный путь, чтобы он работал как локально, так и на сервере.
    const backendUrl = '/api/process-text';

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                promptText: userInput
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        return data.processedText;

    } catch (error) {
        console.error('Ошибка при обращении к бэкенд-сервису:', error);
        // Передаем ошибку выше для обработки в `generateText`
        throw error;
    }
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ СТАТУСА AI ---
async function checkAIStatus() {
    const indicator = document.getElementById('ai-status-indicator');
    const infoRadio = document.getElementById('mode-info');
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        if (data.status === 'ok') {
            indicator.textContent = 'AI Сервис Активен';
            indicator.style.backgroundColor = 'rgba(0, 255, 140, 0.1)';
            indicator.style.color = 'var(--accent-glow)';
            indicator.style.border = '1px solid var(--accent-glow)';
            infoRadio.disabled = false;
        } else {
            indicator.textContent = 'AI Сервис Не настроен';
            indicator.style.backgroundColor = 'rgba(255, 0, 229, 0.1)';
            indicator.style.color = 'var(--error-color)';
            indicator.style.border = '1px solid var(--error-color)';
            infoRadio.disabled = true;
        }
    } catch (error) {
        console.error('Ошибка при проверке статуса AI:', error);
        indicator.textContent = 'Ошибка подключения';
        indicator.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
        indicator.style.color = 'orange';
        indicator.style.border = '1px solid orange';
        infoRadio.disabled = true;
    }
}


// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
    switchMainMode('manual');
    checkAIStatus(); // Проверяем статус при загрузке
});