/**
 * Переключает видимость дополнительных секций в таблице
 * @param {string} sectionClass - Класс строк для переключения
 */
function toggleExtraSection(sectionClass) {
    const checkboxId = sectionClass === 'lv-extra' ? 'toggleLvExtra' : 'toggleRvExtra';
    const isChecked = document.getElementById(checkboxId).checked;
    const rows = document.querySelectorAll('.' + sectionClass);
    rows.forEach(row => {
        row.style.display = isChecked ? 'table-row' : 'none';
    });
}

/**
 * Выполняет релевантные расчеты на основе измененного поля
 * @param {string} changedFieldId - ID измененного поля
 */
function performRelevantCalculations(changedFieldId) {
    console.log(`🔁 Пересчет по изменению поля: ${changedFieldId}`);
    
    // 1. АНТРОПОМЕТРИЯ - ВСЕГДА при изменении любого из полей
    if (changedFieldId === 'weight_kg' || changedFieldId === 'weight_g' || changedFieldId === 'height') {
        if (typeof calculateAnthropometry === 'function') {
            // Небольшая задержка для сбора всех изменений
            setTimeout(() => {
                console.log(`📊 Запуск антропометрии после изменения ${changedFieldId}`);
                calculateAnthropometry();
            }, 50);
        }
        return; // Важно: возвращаемся, чтобы не запускать другие расчеты
    }
    
    // 2. Левый желудочек (параметры Teichholz)
    if (changedFieldId === 'lvedd' || changedFieldId === 'lvesd' || changedFieldId === 'ivsd' || changedFieldId === 'lvpwd') {
        if (typeof calculateLVParameters === 'function') {
            setTimeout(() => calculateLVParameters(), 50);
        }
    }
    
    // 3. Левый желудочек (Simpson)
    if (changedFieldId === 'lvEDV' || changedFieldId === 'lvESV') {
        if (typeof calculateSimpsonParameters === 'function') {
            setTimeout(() => calculateSimpsonParameters(), 50);
        }
        // Z-score для lvEDV при изменении Simpson объема
        if (changedFieldId === 'lvEDV') {
            setTimeout(() => {
                if (typeof calculateAllZScores === 'function') {
                    calculateAllZScores();
                }
            }, 100);
        }
    }

    // 3a. Z-score при смене метода Simpson
    if (changedFieldId === 'simpsonMethod') {
        setTimeout(() => {
            if (typeof calculateAllZScores === 'function') {
                console.log('📈 Пересчет Z-score после смены метода Simpson');
                calculateAllZScores();
            }
        }, 100);
    }

// 4. Митральный клапан
    // 4. Митральный клапан
    if (changedFieldId === 've' || changedFieldId === 'va' || changedFieldId === 'e_septal' || changedFieldId === 'e_lateral' || changedFieldId === 'birthDate') {
        if (typeof calculateGradient === 'function') {
            calculateGradient('mitral');
            calculateGradient('mitralA');
        }
        if (typeof calculateDiastolicLV === 'function') {
            calculateDiastolicLV();
        }
    }
    
    // 5. Клапан аорты
    if (changedFieldId === 'aorticVmax' || changedFieldId === 'lvotVmax_aov') {
        if (typeof calculateAorticGradient === 'function') {
            calculateAorticGradient();
        }
    }
    
    // 6. Трикуспидальный клапан
    if (changedFieldId === 'tvVe') {
        if (typeof calculateGradient === 'function') calculateGradient('tv');
    }
    
    if (changedFieldId === 'tvRegurgVmax') {
        if (typeof calculateRegurgGradient === 'function') calculateRegurgGradient('tv');
    }
    
    // 7. Клапан легочной артерии
    if (changedFieldId === 'pvVmax') {
        if (typeof calculateGradient === 'function') calculateGradient('pv');
    }
    
    // 8. Гемодинамика (УО, СВ, СИ)
    if (changedFieldId === 'vtlzhDiameter' || changedFieldId === 'vtlzhVTI' || changedFieldId === 'mvAnnulusDiam' || changedFieldId === 'mvVTI') {
        if (typeof calculateSV === 'function') {
            setTimeout(() => {
                calculateSV();
                // После расчета УО ВТЛЖ запускаем новые расчеты регургитации
                if (typeof calculateMitralAndRegurg === 'function') {
                    calculateMitralAndRegurg();
                }
            }, 50);
        }
    }
    
    if (changedFieldId === 'hr') {
        if (typeof calculateHemodynamics === 'function') {
            setTimeout(() => calculateHemodynamics(), 50);
        }
    }
    
    // 9. Давление в ЛА
    if (changedFieldId === 'cvpValue' || changedFieldId === 'tvRegurgGradient') {
        if (typeof calculatePAP === 'function') calculatePAP();
    }
    
    // 10. Индексы предсердий
    if (changedFieldId === 'la_volume') {
        if (typeof calculateLAIndex === 'function') calculateLAIndex();
    }
    
    if (changedFieldId === 'ra_volume') {
        if (typeof calculateRAIndex === 'function') calculateRAIndex();
    }
    
    // 11. Фракция сокращения ПЖ
    if (changedFieldId === 'rvAreaDiastole' || changedFieldId === 'rvAreaSystole') {
        if (typeof calculateRVFAC === 'function') calculateRVFAC();
    }
    
    // 11a. Диастолическая функция ЛЖ
    const diastolicFields = ['ve', 'va', 'e_septal', 'e_lateral', 'vp_cm_s', 'mitralADuration', 'pulmonaryArDuration', 'te_ms', 'te_prime_ms', 'ivrt_ms'];
    if (diastolicFields.includes(changedFieldId)) {
        if (typeof calculateEA === 'function') calculateEA();
        if (typeof calculateEe === 'function') calculateEe();
        if (typeof calculateEVp === 'function') calculateEVp();
        if (typeof calculateDiastolicLV === 'function') calculateDiastolicLV();
    }
    
    // 12. Z-score для любых измерений (с большой задержкой)
    const measurementFields = [
        'aortaAnnulus', 'aortaSinus', 'stj', 'ascAorta', 'proxArch', 'distArch',
        'aorticIsthmus', 'descAorta', 'abdoAorta', 'mvAnnulus', 'laDiameter',
        'laArea', 'rvBasal', 'rvAreaDiastole', 'tvAnnulus', 'raDiameter',
        'raArea', 'pvAnnulus', 'paMain', 'paRight', 'paLeft', 'lmca', 'lad', 
        'lcx', 'rca', 'ivcDiameter', 'lvedd', 'ivsd', 'lvpwd', 'lvEDV'
    ];
    
    if (measurementFields.includes(changedFieldId)) {
        clearTimeout(window.zScoreTimeout);
        window.zScoreTimeout = setTimeout(() => {
            if (typeof calculateAllZScores === 'function') {
                console.log(`📈 Запуск расчета Z-score после изменения ${changedFieldId}`);
                calculateAllZScores();
            }
        }, 800); // Большая задержка для Z-score
    }
}

/**
 * Настраивает обработчик для запятой как десятичного разделителя
 * С ДОПОЛНИТЕЛЬНЫМ ЗАПУСКОМ РАСЧЕТОВ
 */
function setupDecimalSeparatorHandler() {
    document.addEventListener('input', function(event) {
        const target = event.target;
        
        // Проверяем, что это поле ввода числа или текста
        if ((target.type === 'text' || target.type === 'number') && 
            target.value.includes(',')) {
            
            // Заменяем запятую на точку
            const newValue = target.value.replace(',', '.');
            
            // Проверяем, что получилось валидное число
            if (!isNaN(parseFloat(newValue)) && isFinite(newValue)) {
                target.value = newValue;
                
                // НЕМЕДЛЕННО запускаем расчеты для этого поля
                setTimeout(() => {
                    if (target.id && typeof performRelevantCalculations === 'function') {
                        performRelevantCalculations(target.id);
                    }
                }, 10);
                
                console.log(`🔢 Запятая заменена на точку в поле: ${target.id}`);
            }
        }
    });
    
    console.log('Обработчик десятичных разделителей настроен');
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ РАСЧЕТА =====

/**
 * Расчет отношения E/A
 */
window.calculateEA = function() {
    const ve = parseFloat(document.getElementById('ve').value) || 0;
    const va = parseFloat(document.getElementById('va').value) || 0;
    
    if (ve > 0 && va > 0) {
        const e_a_ratio = (ve / va).toFixed(2);
        const e_a_main = document.getElementById('e_a_ratio');
        const e_a_diast = document.getElementById('e_a_ratio_diast');
        
        if (e_a_main) e_a_main.value = e_a_ratio;
        if (e_a_diast) e_a_diast.value = e_a_ratio;
        console.log('✅ E/A рассчитано:', e_a_ratio);
    } else {
        const e_a_main = document.getElementById('e_a_ratio');
        const e_a_diast = document.getElementById('e_a_ratio_diast');
        
        if (e_a_main) e_a_main.value = '';
        if (e_a_diast) e_a_diast.value = '';
    }
};

/**
 * Расчет отношения E/e'
 */
window.calculateEe = function() {
    const ve = parseFloat(document.getElementById('ve').value) || 0;
    const e_septal = parseFloat(document.getElementById('e_septal').value) || 0;
    const e_lateral = parseFloat(document.getElementById('e_lateral').value) || 0;

    // Рассчитываем среднее e' (используем любое введенное значение или среднее от двух)
    let e_prime_average = 0;
    if (e_septal > 0 && e_lateral > 0) {
        e_prime_average = (e_septal + e_lateral) / 2;
    } else if (e_septal > 0) {
        e_prime_average = e_septal;
    } else if (e_lateral > 0) {
        e_prime_average = e_lateral;
    }

    const e_e_main = document.getElementById('e_e_ratio');
    const e_e_diast = document.getElementById('e_e_ratio_diast');

    if (ve > 0 && e_prime_average > 0) {
        // Преобразуем ve из м/с в см/с (умножаем на 100)
        const ve_cm_s = ve * 100;
        const e_e_ratio = (ve_cm_s / e_prime_average).toFixed(1);
        if (e_e_main) e_e_main.value = e_e_ratio;
        if (e_e_diast) e_e_diast.value = e_e_ratio;
        console.log('✅ E/e\' рассчитано (среднее e\'):', e_e_ratio);
    } else {
        if (e_e_main) e_e_main.value = '';
        if (e_e_diast) e_e_diast.value = '';
    }
};

/**
 * Расчет градиентов давления
 */
window.calculateGradient = function(valveType) {
    const gradientMap = {
        'mitral': { vmaxId: 've', gradientId: 'mitralPeakGradient' },
        'mitralA': { vmaxId: 'va', gradientId: 'mitralAPeakGradient' },
        'aortic': { vmaxId: 'aorticVmax', gradientId: 'aorticPeakGradient' },
        'tv': { vmaxId: 'tvVe', gradientId: 'tvPeakGradient' },
        'pv': { vmaxId: 'pvVmax', gradientId: 'pvPeakGradient' }
    };
    
    if (gradientMap[valveType]) {
        const vmax = parseFloat(document.getElementById(gradientMap[valveType].vmaxId).value) || 0;
        if (vmax > 0) {
            const gradient = (4 * Math.pow(vmax, 2)).toFixed(1);
            document.getElementById(gradientMap[valveType].gradientId).value = gradient;
            console.log(`✅ Градиент ${valveType} рассчитан:`, gradient, 'mmHg');
        } else {
            document.getElementById(gradientMap[valveType].gradientId).value = '';
        }
    }
};

/**
 * Расчет градиента регургитации
 */
window.calculateRegurgGradient = function(valveType) {
    if (valveType === 'tv') {
        const vmax = parseFloat(document.getElementById('tvRegurgVmax').value) || 0;
        if (vmax > 0) {
            const gradient = (4 * Math.pow(vmax, 2)).toFixed(1);
            document.getElementById('tvRegurgGradient').value = gradient;
            
            // Запускаем расчет давления в ЛА
            if (typeof calculatePAP === 'function') calculatePAP();
            console.log('✅ Градиент регургитации ТК рассчитан:', gradient);
        } else {
            document.getElementById('tvRegurgGradient').value = '';
        }
    }
};

/**
 * Расчет ударного объема
 */
window.calculateSV = function() {
    const diameter = parseFloat(document.getElementById('vtlzhDiameter').value) || 0;
    const vti = parseFloat(document.getElementById('vtlzhVTI').value) || 0;
    
    if (diameter > 0 && vti > 0) {
        const radius = diameter / 2;
        const area = Math.PI * Math.pow(radius, 2);
        const sv = (area * vti).toFixed(1);
        document.getElementById('svVTLZH').value = sv;
        console.log('✅ УО рассчитан:', sv, 'мл');
        
        // Запускаем расчет СВ и СИ
        if (typeof calculateHemodynamics === 'function') calculateHemodynamics();
    } else {
        document.getElementById('svVTLZH').value = '';
    }
};

/**
 * Расчет сердечного выброса и сердечного индекса
 */
window.calculateHemodynamics = function() {
    const sv = parseFloat(document.getElementById('svVTLZH').value) || 0;
    const hr = parseFloat(document.getElementById('hr').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;
    
    if (sv > 0 && hr > 0) {
        const co = (sv * hr / 1000).toFixed(2);
        document.getElementById('coVTLZH').value = co;
        console.log('✅ СВ рассчитан:', co, 'л/мин');
        
        if (bsa > 0) {
            const ci = (co / bsa).toFixed(2);
            document.getElementById('ciVTLZH').value = ci;
            console.log('✅ СИ рассчитан:', ci, 'л/мин/м²');
        } else {
            document.getElementById('ciVTLZH').value = '';
        }
    } else {
        document.getElementById('coVTLZH').value = '';
        document.getElementById('ciVTLZH').value = '';
    }
};

/**
 * Расчет давления в легочной артерии
 */
window.calculatePAP = function() {
    const cvp = parseFloat(document.getElementById('cvpValue').value) || 0;
    const gradient = parseFloat(document.getElementById('tvRegurgGradient').value) || 0;
    
    if (gradient > 0) {
        const pap = (gradient + cvp).toFixed(1);
        document.getElementById('papValue').value = pap;
        console.log('✅ Давление в ЛА рассчитано:', pap, 'mmHg');
    } else {
        document.getElementById('papValue').value = '';
    }
};

/**
 * Обработчик для чекбоксов e'/a'
 */
window.toggleEAPComparison = function(type) {
    const checkbox = document.getElementById(type + '_checkbox');
    const selector = document.getElementById(type + '_selector');
    
    if (checkbox && selector) {
        if (checkbox.checked) {
            selector.style.display = 'block';
        } else {
            selector.style.display = 'none';
            const display = document.getElementById(type + '_sign_display');
            if (display) display.textContent = '?';
        }
    }
};

/**
 * Обновление знака сравнения для e'/a'
 */
window.updateEAPSign = function(type) {
    const select = document.getElementById(type + '_sign');
    const display = document.getElementById(type + '_sign_display');
    
    if (select && display) {
        display.textContent = select.value || '?';
    }
};

/**
 * Скрытие селектора знака сравнения для e'/a'
 */
window.collapseEAPComparison = function(type) {
    const selector = document.getElementById(type + '_selector');
    if (selector) selector.style.display = 'none';
};

/**
 * Функция для метода Симпсона
 */
window.toggleSimpsonMethod = function() {
    const checkbox = document.getElementById('simpsonMethodCheckbox');
    const select = document.getElementById('simpsonMethod');
    
    if (checkbox && select) {
        select.style.display = checkbox.checked ? 'inline-block' : 'none';
    }
};

/**
 * Мобильный фикс: принудительный расчет при изменении поля
 */
window.forceMobileCalculation = function(fieldId) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log(`📱 Мобильный расчет для поля: ${fieldId}`);
        
        // Небольшая задержка для мобильных устройств
        setTimeout(() => {
            if (typeof performRelevantCalculations === 'function') {
                performRelevantCalculations(fieldId);
            }
        }, 200);
    }
};

/**
 * Проверка мобильного устройства
 */
window.isMobileDevice = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Функция для отладки
 */
// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
function updateAge() {
    const birthDateInput = document.getElementById('birthDate');
    const ageInput = document.getElementById('age');
    
    if (!birthDateInput || !ageInput || !birthDateInput.value) {
        if (ageInput) ageInput.value = '';
        return;
    }

    const birthDate = new Date(birthDateInput.value);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
        ageInput.value = '';
        return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months -= 1;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    let ageText = "";
    if (years > 0) {
        ageText = `${years} г. ${months} мес.`;
    } else if (months > 0) {
        ageText = `${months} мес. ${days} дн.`;
    } else {
        ageText = `${days} дн.`;
    }
    
    ageInput.value = ageText;
    
    // Вызываем пересчет всех зависимых параметров
    if (typeof calculateAllZScores === 'function') calculateAllZScores();
    if (typeof calculateLVParameters === 'function') calculateLVParameters();
    if (typeof calculateDiastolicLV === 'function') calculateDiastolicLV();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация приложения...');

    // Слушатель для даты рождения
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        birthDateInput.addEventListener('change', updateAge);
    }

    // Динамическая вставка блока диастолической функции, если его нет в HTML
    const placeholder = document.getElementById('diastolicBlockPlaceholder');
    if (placeholder && !document.getElementById('diastolicContent')) {
        placeholder.outerHTML = `
            <div class="diastolic-checkbox-container" style="margin: 20px 0;">
                <input type="checkbox" id="diastolicFunctionCheckbox" onchange="toggleDiastolicBlock()">
                <label for="diastolicFunctionCheckbox"><strong>Диастолическая функция левого желудочка:</strong></label>
            </div>
            <div id="diastolicContent" class="diastolic-content" style="display: none; padding: 15px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9; margin-bottom: 20px;">
                <div class="row">
                    <div class="col">
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <label style="min-width: auto;">Е/А:</label>
                            <input type="text" id="e_a_ratio_diast" placeholder="E/A" style="width: 70px;" readonly>
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <label style="min-width: auto;">E/e' (среднее):</label>
                            <input type="text" id="e_e_ratio_diast" style="width: 80px;" readonly>
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="min-width: auto;">ЦДК М-режим Vp, см/с:</label>
                            <input type="number" id="vp_cm_s" placeholder="Vp" style="width: 80px;" oninput="performRelevantCalculations('vp_cm_s')">
                            <span>E/Vp:</span>
                            <input type="text" id="e_vp_ratio" style="width: 70px;" readonly>
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <input type="checkbox" id="arADurationCheckbox" onchange="toggleVisibility('arADurationRow')">
                            <label for="arADurationCheckbox" style="min-width: auto;">Ar-A duration:</label>
                            <div id="arADurationRow" style="display: none; align-items: center; gap: 5px;">
                                <input type="number" id="mitralADuration" placeholder="A, мс" style="width: 80px;" oninput="performRelevantCalculations('mitralADuration')">
                                <input type="number" id="pulmonaryArDuration" placeholder="Ar, мс" style="width: 80px;" oninput="performRelevantCalculations('pulmonaryArDuration')">
                                <input type="text" id="arADuration" placeholder="Rez" style="width: 70px;" readonly>
                            </div>
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="dteCheckbox" onchange="toggleVisibility('dteInput')">
                            <label for="dteCheckbox" style="min-width: auto;">DTE, мс:</label>
                            <input type="number" id="dteInput" style="width: 80px; display: none;">
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="ivrtCheckbox" onchange="toggleVisibility('ivrt_ms')">
                            <label for="ivrtCheckbox" style="min-width: auto;">IVRT, мс:</label>
                            <input type="number" id="ivrt_ms" style="width: 80px; display: none;" oninput="performRelevantCalculations('ivrt_ms')">
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <input type="checkbox" id="teEPrimeCheckbox" onchange="toggleVisibility('teEPrimeRow')">
                            <label for="teEPrimeCheckbox" style="min-width: auto;">TE-e':</label>
                            <div id="teEPrimeRow" style="display: none; align-items: center; gap: 5px;">
                                <input type="number" id="te_ms" placeholder="TE" style="width: 70px;" oninput="performRelevantCalculations('te_ms')">
                                <input type="number" id="te_prime_ms" placeholder="Te'" style="width: 70px;" oninput="performRelevantCalculations('te_prime_ms')">
                                <input type="text" id="te_e_prime_diff" placeholder="Rez" style="width: 60px;" readonly>
                            </div>
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="ivrtTeERatioCheckbox" onchange="toggleVisibility('ivrt_te_e_ratio')">
                            <label for="ivrtTeERatioCheckbox" style="min-width: auto;">IVRT/TE-e':</label>
                            <input type="text" id="ivrt_te_e_ratio" style="width: 80px; display: none;" readonly>
                        </div>
                    </div>
                </div>
                <div class="template-section no-print" style="margin-top: 20px;">
                    <div class="template-controls" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <input type="checkbox" id="diastolicTextTemplateCheckbox" onchange="toggleTemplate('diastolicText')">
                        <label for="diastolicTextTemplateCheckbox">Шаблоны описания:</label>
                        <select id="diastolicTextTemplateSelect" class="template-select" onchange="applyTemplate('diastolicText')">
                            <option value="">Выберите шаблон</option>
                        </select>
                        <input type="text" id="diastolicTextTemplateInput" class="template-input" placeholder="Новый шаблон" style="display:none; width: 150px;">
                        <button onclick="addTemplate('diastolicText')" class="small-button">Добавить</button>
                        <div class="template-actions">
                            <button onclick="editTemplate('diastolicText')" class="small-button" style="background: #28a745;">Изм</button>
                            <button onclick="deleteTemplate('diastolicText')" class="small-button" style="background: #dc3545;">Уд</button>
                        </div>
                    </div>
                    <textarea id="diastolicText" rows="4" placeholder="Введите описание диастолической функции..." style="margin-top: 10px; width: 100%;"></textarea>
                </div>
            </div>
        `;
    }

    // Инициализация всех модулей
    if (typeof initializeAllTemplateSelects === 'function') {
        initializeAllTemplateSelects();
    }
});
