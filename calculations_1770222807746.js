// ===== CALCULATIONS.JS - ПОЛНАЯ ВЕРСИЯ С ВСЕМИ ФУНКЦИЯМИ =====
console.log('✅ calculations.js загружается...');

// ===== КОНСТАНТЫ ДЛЯ Z-SCORE =====
const Z_SCORE_CONSTANTS = {
    aortaAnnulus: { a: 2.750, b: 0.515, c: 0.088 },
    aortaSinus: { a: 3.051, b: 0.481, c: 0.092 },
    stj: { a: 2.797, b: 0.512, c: 0.098 },
    ascAorta: { a: 2.949, b: 0.486, c: 0.096 },
    proxArch: { a: 2.742, b: 0.515, c: 0.121 },
    distArch: { a: 2.572, b: 0.521, c: 0.124 },
    aorticIsthmus: { a: 2.356, b: 0.550, c: 0.146 },
    descAorta: { a: 2.518, b: 0.498, c: 0.130 },
    abdoAorta: { a: 2.352, b: 0.477, c: 0.122 },
    mvAnnulus: { a: 3.161, b: 0.471, c: 0.087 },
    laDiameter: { a: 3.402, b: 0.454, c: 0.095 },
    laArea: { a: 2.191, b: 0.894, c: 0.165 },
    lvEDV_a4ch: { a: 3.868, b: 1.405, c: 0.215 },
    lvEDV_biplane: { a: 3.870, b: 1.406, c: 0.211 },
    lvedd: { a: 3.634, b: 0.464, c: 0.091 },
    rvBasal: { a: 3.445, b: 0.499, c: 0.113 },
    rvAreaDiastole: { a: 2.443, b: 0.955, c: 0.171 },
    tvAnnulus: { a: 3.187, b: 0.466, c: 0.14 },
    raDiameter: { a: 3.450, b: 0.478, c: 0.105 },
    raArea: { a: 2.235, b: 0.911, c: 0.178 },
    pvAnnulus: { a: 2.908, b: 0.538, c: 0.113 },
    paMain: { a: 2.945, b: 0.489, c: 0.113 },
    paRight: { a: 2.397, b: 0.558, c: 0.145 },
    paLeft: { a: 2.383, b: 0.569, c: 0.159 }
};

// ===== ВАЖНО: ЭТА ФУНКЦИЯ ПЕРВАЯ! =====
function calculateBSAHaycock(weight, height) {
    // Формула Haycock: BSA = 0.024265 × вес^0.5378 × рост^0.3964
    return 0.024265 * Math.pow(weight, 0.5378) * Math.pow(height, 0.3964);
}

// ===== ОСНОВНАЯ ФУНКЦИЯ АНТРОПОМЕТРИИ =====
function calculateAnthropometry() {
    console.log('📊 calculateAnthropometry вызвана');
    
    const height = parseFloat(document.getElementById('height').value) || 0;
    const weightKg = parseFloat(document.getElementById('weight_kg').value) || 0;
    const weightG = parseFloat(document.getElementById('weight_g').value) || 0;
    
    const totalWeight = weightKg + (weightG / 1000);
    
    console.log('📐 Данные: рост=', height, 'см, вес=', totalWeight, 'кг');
    
    if (height > 0 && totalWeight > 0) {
        const heightM = height / 100;
        const bmi = (totalWeight / (heightM * heightM)).toFixed(1);
        const bsa = calculateBSAHaycock(totalWeight, height).toFixed(2);
        
        document.getElementById('bmi').value = bmi;
        document.getElementById('bsa').value = bsa;
        
        console.log('✅ Рассчитано: ИМТ=', bmi, 'ППТ=', bsa, 'м²');
        
        // ВАЖНО: Запускаем ВСЕ расчеты, зависящие от антропометрии
        setTimeout(() => {
            // 1. Расчет индексов предсердий
            if (typeof calculateLAIndex === 'function') calculateLAIndex();
            if (typeof calculateRAIndex === 'function') calculateRAIndex();
            
            // 2. Расчет Z-score для ВСЕХ полей
            if (typeof calculateAllZScores === 'function') {
                console.log('📈 Запуск расчета Z-score после расчета ППТ');
                calculateAllZScores();
            }
            
    // 3. Другие расчеты, зависящие от ППТ
    if (typeof calculateLVParameters === 'function') calculateLVParameters();
    if (typeof calculateSimpsonParameters === 'function') calculateSimpsonParameters();
    if (typeof calculateSV === 'function') calculateSV();
    if (typeof calculateHemodynamics === 'function') calculateHemodynamics();
            
        }, 100);
        
    } else {
        document.getElementById('bmi').value = '';
        document.getElementById('bsa').value = '';
        console.log('⏳ Ожидание данных: нужны и рост, и вес');
        
        // Очищаем зависимые поля при отсутствии данных
        document.getElementById('la_volume_index').value = '';
        document.getElementById('ra_volume_index').value = '';
        document.getElementById('lvMassIndex').value = '';
    }
}

// ===== Z-SCORE РАСЧЕТЫ (ИСПРАВЛЕННЫЕ ПО НОВОЙ ФОРМУЛЕ) =====
function calculateAllZScores() {
    console.log('📈 calculateAllZScores вызвана');
    
    const bsaRaw = parseFloat(document.getElementById('bsa').value) || 0;
    const bsa = Math.round(bsaRaw * 100) / 100; // Округление до 2 знаков
    
    if (!bsa || bsa <= 0) {
        console.log('⏳ Недостаточно данных для расчета Z-score: нужна ППТ');
        clearAllZScoreFields();
        return;
    }
    
    console.log(`📊 Данные для Z-score: ППТ=${bsa} м²`);
    
    // 1. Стандартные Z-score расчеты
    calculateStandardZScores(bsa);
    
    // 2. Специальные расчеты (толщина стенок, IVC, коронарные артерии)
    calculateSpecialZScores(bsa);
    
    console.log('✅ Z-score расчеты завершены');
}

// Стандартные Z-score расчеты по формуле: Z = (ln(measurement) - (a + b * ln(bsa))) / c
function calculateStandardZScores(bsa) {
    const standardCalculations = [
        { id: 'aortaAnnulus', const: Z_SCORE_CONSTANTS.aortaAnnulus },
        { id: 'aortaSinus', const: Z_SCORE_CONSTANTS.aortaSinus },
        { id: 'stj', const: Z_SCORE_CONSTANTS.stj },
        { id: 'ascAorta', const: Z_SCORE_CONSTANTS.ascAorta },
        { id: 'proxArch', const: Z_SCORE_CONSTANTS.proxArch },
        { id: 'distArch', const: Z_SCORE_CONSTANTS.distArch },
        { id: 'aorticIsthmus', const: Z_SCORE_CONSTANTS.aorticIsthmus },
        { id: 'descAorta', const: Z_SCORE_CONSTANTS.descAorta },
        { id: 'abdoAorta', const: Z_SCORE_CONSTANTS.abdoAorta },
        { id: 'mvAnnulus', const: Z_SCORE_CONSTANTS.mvAnnulus },
        { id: 'laDiameter', const: Z_SCORE_CONSTANTS.laDiameter },
        { id: 'laArea', const: Z_SCORE_CONSTANTS.laArea },
        { id: 'lvedd', const: Z_SCORE_CONSTANTS.lvedd },
        { id: 'rvBasal', const: Z_SCORE_CONSTANTS.rvBasal },
        { id: 'rvAreaDiastole', const: Z_SCORE_CONSTANTS.rvAreaDiastole },
        { id: 'tvAnnulus', const: Z_SCORE_CONSTANTS.tvAnnulus },
        { id: 'raDiameter', const: Z_SCORE_CONSTANTS.raDiameter },
        { id: 'raArea', const: Z_SCORE_CONSTANTS.raArea },
        { id: 'pvAnnulus', const: Z_SCORE_CONSTANTS.pvAnnulus },
        { id: 'paMain', const: Z_SCORE_CONSTANTS.paMain },
        { id: 'paRight', const: Z_SCORE_CONSTANTS.paRight },
        { id: 'paLeft', const: Z_SCORE_CONSTANTS.paLeft }
    ];
    
    standardCalculations.forEach(item => {
        const measurement = parseFloat(document.getElementById(item.id).value);
        if (measurement && measurement > 0) {
            const z = (Math.log(measurement) - (item.const.a + item.const.b * Math.log(bsa))) / item.const.c;
            updateZScoreElement(`z-${item.id}`, z);
        } else {
            clearZScoreElement(`z-${item.id}`);
        }
    });
    
    // Z-score для lvEDV (Simpson) с учетом метода
    const method = document.getElementById('simpsonMethod') ? document.getElementById('simpsonMethod').value : '';
    const lvEDV = parseFloat(document.getElementById('lvEDV').value);
    
    if (lvEDV && lvEDV > 0) {
        let z;
        if (method === 'a4ch') {
            z = (Math.log(lvEDV) - (Z_SCORE_CONSTANTS.lvEDV_a4ch.a + Z_SCORE_CONSTANTS.lvEDV_a4ch.b * Math.log(bsa))) / Z_SCORE_CONSTANTS.lvEDV_a4ch.c;
        } else if (method === 'biplane') {
            z = (Math.log(lvEDV) - (Z_SCORE_CONSTANTS.lvEDV_biplane.a + Z_SCORE_CONSTANTS.lvEDV_biplane.b * Math.log(bsa))) / Z_SCORE_CONSTANTS.lvEDV_biplane.c;
        } else {
            // По умолчанию используем a4ch
            z = (Math.log(lvEDV) - (Z_SCORE_CONSTANTS.lvEDV_a4ch.a + Z_SCORE_CONSTANTS.lvEDV_a4ch.b * Math.log(bsa))) / Z_SCORE_CONSTANTS.lvEDV_a4ch.c;
        }
        updateZScoreElement('z-lvEDV', z);
    } else {
        clearZScoreElement('z-lvEDV');
    }
}

// Специальные Z-score расчеты с уникальными формулами
function calculateSpecialZScores(bsa) {
    // Z-score для толщины МЖП (Lopez et al.)
    const ivsd = parseFloat(document.getElementById('ivsd').value) / 10; // мм -> см
    if (ivsd && ivsd > 0) {
        const normalized = ivsd / Math.pow(bsa, 0.4);
        const z = (normalized - 0.58) / 0.09;
        updateZScoreElement('z-ivsd', z);
    } else {
        clearZScoreElement('z-ivsd');
    }
    
    // Z-score для толщины ЗСЛЖ (Lopez et al.)
    const lvpwd = parseFloat(document.getElementById('lvpwd').value) / 10; // мм -> см
    if (lvpwd && lvpwd > 0) {
        const normalized = lvpwd / Math.pow(bsa, 0.4);
        const z = (normalized - 0.57) / 0.09;
        updateZScoreElement('z-lvpwd', z);
    } else {
        clearZScoreElement('z-lvpwd');
    }
    
    // Z-score для нижней полой вены
    const ivcDiameter = parseFloat(document.getElementById('ivcDiameter').value);
    if (ivcDiameter && ivcDiameter > 0) {
        const z = (Math.log(ivcDiameter) - (2.406 + 0.826 * Math.log(bsa))) / 0.24;
        updateZScoreElement('z-ivcDiameter', z);
    } else {
        clearZScoreElement('z-ivcDiameter');
    }
    
    // Z-score для коронарных артерий
    calculateCoronaryArteryZScores(bsa);
}

// Z-score для коронарных артерий
function calculateCoronaryArteryZScores(bsa) {
    const sqrtBSA = Math.sqrt(bsa);
    
    // LMCA
    const lmca = parseFloat(document.getElementById('lmca').value);
    if (lmca && lmca > 0) {
        const expected = -0.1817 + 2.9238 * sqrtBSA;
        const denominator = 0.1801 + 0.253 * sqrtBSA;
        const z = (lmca - expected) / denominator;
        updateZScoreElement('z-lmca', z);
    } else {
        clearZScoreElement('z-lmca');
    }
    
    // LAD
    const lad = parseFloat(document.getElementById('lad').value);
    if (lad && lad > 0) {
        const expected = -0.1502 + 2.2672 * sqrtBSA;
        const denominator = 0.1709 + 0.2293 * sqrtBSA;
        const z = (lad - expected) / denominator;
        updateZScoreElement('z-lad', z);
    } else {
        clearZScoreElement('z-lad');
    }
    
    // LCX
    const lcx = parseFloat(document.getElementById('lcx').value);
    if (lcx && lcx > 0) {
        const expected = -0.2716 + 2.3458 * sqrtBSA;
        const denominator = 0.1142 + 0.3423 * sqrtBSA;
        const z = (lcx - expected) / denominator;
        updateZScoreElement('z-lcx', z);
    } else {
        clearZScoreElement('z-lcx');
    }
    
    // RCA
    const rca = parseFloat(document.getElementById('rca').value);
    if (rca && rca > 0) {
        const expected = -0.3039 + 2.7521 * sqrtBSA;
        const denominator = 0.1626 + 0.2881 * sqrtBSA;
        const z = (rca - expected) / denominator;
        updateZScoreElement('z-rca', z);
    } else {
        clearZScoreElement('z-rca');
    }
}

// Обновление элемента Z-score
function updateZScoreElement(elementId, zScore) {
    const zElement = document.getElementById(elementId);
    if (zElement) {
        const rounded = Math.round(zScore * 100) / 100;
        zElement.textContent = rounded;
        
        const absZ = Math.abs(rounded);
        if (absZ > 2) {
            zElement.style.color = '#e74c3c';
            zElement.style.fontWeight = 'bold';
        } else if (absZ > 1.5) {
            zElement.style.color = '#f39c12';
            zElement.style.fontWeight = 'normal';
        } else {
            zElement.style.color = '#0066cc';
            zElement.style.fontWeight = 'normal';
        }
    }
}

// Очистка элемента Z-score
function clearZScoreElement(elementId) {
    const zElement = document.getElementById(elementId);
    if (zElement) {
        zElement.textContent = '-';
        zElement.style.color = '#0066cc';
        zElement.style.fontWeight = 'normal';
    }
}

// Очистка всех Z-score полей
function clearAllZScoreFields() {
    const zScoreFields = [
        'aortaAnnulus', 'aortaSinus', 'stj', 'ascAorta', 'proxArch', 'distArch',
        'aorticIsthmus', 'descAorta', 'abdoAorta', 'mvAnnulus', 'laDiameter',
        'laArea', 'lvedd', 'ivsd', 'lvpwd', 'rvBasal', 'rvAreaDiastole',
        'tvAnnulus', 'raDiameter', 'raArea', 'pvAnnulus', 'paMain',
        'paRight', 'paLeft', 'lmca', 'lad', 'lcx', 'rca', 'ivcDiameter',
        'lvEDV'  // ДОБАВЛЕНО
    ];
    
    zScoreFields.forEach(fieldId => {
        clearZScoreElement(`z-${fieldId}`);
    });
}

// ===== ИНДЕКСЫ ПРЕДСЕРДИЙ =====
function calculateLAIndex() {
    const laVolume = parseFloat(document.getElementById('la_volume').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;
    
    if (laVolume > 0 && bsa > 0) {
        const index = (laVolume / bsa).toFixed(1);
        document.getElementById('la_volume_index').value = index;
        console.log('✅ LA индекс рассчитан:', index);
    } else {
        document.getElementById('la_volume_index').value = '';
    }
}

function calculateRAIndex() {
    const raVolume = parseFloat(document.getElementById('ra_volume').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;
    
    if (raVolume > 0 && bsa > 0) {
        const index = (raVolume / bsa).toFixed(1);
        document.getElementById('ra_volume_index').value = index;
        console.log('✅ RA индекс рассчитан:', index);
    } else {
        document.getElementById('ra_volume_index').value = '';
    }
}

// ===== ПРАВЫЙ ЖЕЛУДОЧЕК (RV FAC) =====
function calculateRVFAC() {
    const rvAreaDiastole = parseFloat(document.getElementById('rvAreaDiastole').value) || 0;
    const rvAreaSystole = parseFloat(document.getElementById('rvAreaSystole').value) || 0;
    
    if (rvAreaDiastole > 0 && rvAreaSystole > 0 && rvAreaDiastole > rvAreaSystole) {
        const rvFAC = ((rvAreaDiastole - rvAreaSystole) / rvAreaDiastole * 100).toFixed(1);
        document.getElementById('rvFAC').value = rvFAC;
        console.log('✅ RV FAC рассчитан:', rvFAC);
    } else {
        document.getElementById('rvFAC').value = '';
    }
}

// ===== ЛЕВЫЙ ЖЕЛУДОЧЕК (Teichholz) =====
// ===== РЕФЕРЕНСНЫЕ НОРМЫ LVMI (Khoury 2009) =====
const LVMI_REFERENCE = {
    centile_95: [
        { age_group: "< 6 mo", sex: "male", value: 85.6 },
        { age_group: "< 6 mo", sex: "female", value: 80.1 },
        { age_group: "6 mo ≤ 2 y", sex: "male", value: 57.1 },
        { age_group: "6 mo ≤ 2 y", sex: "female", value: 68.6 },
        { age_group: "2 ≤ 4 y", sex: "male", value: 55.3 },
        { age_group: "2 ≤ 4 y", sex: "female", value: 52.4 },
        { age_group: "4 ≤ 6 y", sex: "male", value: 44.3 },
        { age_group: "4 ≤ 6 y", sex: "female", value: 48.1 },
        { age_group: "6 ≤ 8 y", sex: "male", value: 43.5 },
        { age_group: "6 ≤ 8 y", sex: "female", value: 44.6 },
        { age_group: "8 ≤ 10 y", sex: "male", value: 36.0 },
        { age_group: "8 ≤ 10 y", sex: "female", value: 41.0 },
        { age_group: "10 ≤ 12 y", sex: "male", value: 35.7 },
        { age_group: "10 ≤ 12 y", sex: "female", value: 38.2 },
        { age_group: "12 ≤ 14 y", sex: "male", value: 38.2 },
        { age_group: "12 ≤ 14 y", sex: "female", value: 41.4 },
        { age_group: "14 ≤ 16 y", sex: "male", value: 36.9 },
        { age_group: "14 ≤ 16 y", sex: "female", value: 40.5 },
        { age_group: "≥16 y", sex: "male", value: 40.0 },
        { age_group: "≥16 y", sex: "female", value: 39.4 }
    ],
    getAgeGroupFromAgeMonths(ageInMonths) {
        if (ageInMonths < 6) return "< 6 mo";
        if (ageInMonths < 24) return "6 mo ≤ 2 y";
        if (ageInMonths < 48) return "2 ≤ 4 y";
        if (ageInMonths < 72) return "4 ≤ 6 y";
        if (ageInMonths < 96) return "6 ≤ 8 y";
        if (ageInMonths < 120) return "8 ≤ 10 y";
        if (ageInMonths < 144) return "10 ≤ 12 y";
        if (ageInMonths < 168) return "12 ≤ 14 y";
        if (ageInMonths < 192) return "14 ≤ 16 y";
        return "≥16 y";
    },
    evaluate(ageInMonths, sex, calculatedLVMI) {
        if (!ageInMonths && ageInMonths !== 0) return '';
        if (!sex) return '';
        if (!calculatedLVMI || calculatedLVMI <= 0) return '';
        
        const ageGroup = this.getAgeGroupFromAgeMonths(ageInMonths);
        const entry = this.centile_95.find(item => item.age_group === ageGroup && item.sex === sex);
        if (!entry) return "";

        if (calculatedLVMI <= entry.value) {
            return "В пределах 95 центиля для пола и возраста";
        } else {
            return "Превышает 95 центиль для пола и возраста";
        }
    }
};

function calculateLVParameters() {
    const lvedd = parseFloat(document.getElementById('lvedd').value) || 0;
    const lvesd = parseFloat(document.getElementById('lvesd').value) || 0;
    const ivsd = parseFloat(document.getElementById('ivsd').value) || 0;
    const lvpwd = parseFloat(document.getElementById('lvpwd').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;

    // 1. Фракция укорочения (требует КСР - lvesd)
    if (lvedd > 0 && lvesd > 0) {
        const fs = ((lvedd - lvesd) / lvedd * 100).toFixed(1);
        document.getElementById('fs').value = fs;
        console.log('✅ FS рассчитан:', fs);
    } else {
        document.getElementById('fs').value = '';
    }

    // 2. Индекс массы миокарда (ASE formula)
    if (lvedd > 0 && ivsd > 0 && lvpwd > 0) {
        const lveddCm = lvedd / 10;
        const ivsdCm = ivsd / 10;
        const lvpwdCm = lvpwd / 10;
        const heightM = (parseFloat(document.getElementById('height').value) || 0) / 100;

        // Масса миокарда (ASE formula)
        const mass = 0.8 * (1.04 * (Math.pow(lveddCm + lvpwdCm + ivsdCm, 3) - Math.pow(lveddCm, 3))) + 0.6;
        const lvMassInput = document.getElementById('lvMass');
        if (lvMassInput) lvMassInput.value = mass.toFixed(1);
        
        // RWT (Относительная толщина стенок)
        const rwt = (ivsd + lvpwd) / lvedd;
        const rwtInput = document.getElementById('lvRwt');
        if (rwtInput) rwtInput.value = rwt.toFixed(2);

        if (heightM > 0) {
            const massIndex = mass / Math.pow(heightM, 2.7);
            const lvMassIndexInput = document.getElementById('lvMassIndex');
            const roundedMassIndex = Math.round(massIndex * 100) / 100;
            if (lvMassIndexInput) lvMassIndexInput.value = roundedMassIndex;
            
            // Оценка LVMI
            const birthDateValue = document.getElementById('birthDate')?.value;
            const sex = document.getElementById('gender')?.value;
            const evalField = document.getElementById('lvMassIndex_evaluation');
            
            if (birthDateValue && sex && evalField) {
                const birthDate = new Date(birthDateValue);
                const today = new Date();
                const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
                const evaluation = LVMI_REFERENCE.evaluate(ageInMonths, sex, roundedMassIndex);
                
                evalField.textContent = evaluation;
                if (evaluation.includes('Превышает')) {
                    evalField.style.color = '#e74c3c';
                    evalField.style.fontWeight = 'bold';
                } else {
                    evalField.style.color = '#28a745';
                    evalField.style.fontWeight = 'normal';
                }
            } else if (evalField) {
                evalField.textContent = '';
            }
            
            console.log('✅ Индекс массы рассчитан:', massIndex.toFixed(2));
        } else {
            const lvMassIndexInput = document.getElementById('lvMassIndex');
            if (lvMassIndexInput) lvMassIndexInput.value = '';
            const evalField = document.getElementById('lvMassIndex_evaluation');
            if (evalField) evalField.textContent = '';
        }
    } else {
        const lvMassInput = document.getElementById('lvMass');
        if (lvMassInput) lvMassInput.value = '';
        const lvMassIndexInput = document.getElementById('lvMassIndex');
        if (lvMassIndexInput) lvMassIndexInput.value = '';
        const rwtInput = document.getElementById('lvRwt');
        if (rwtInput) rwtInput.value = '';
        const evalField = document.getElementById('lvMassIndex_evaluation');
        if (evalField) evalField.textContent = '';
    }
}

// ===== ЛЕВЫЙ ЖЕЛУДОЧЕК (Simpson) =====
function calculateSimpsonParameters() {
    const lvEDV = parseFloat(document.getElementById('lvEDV').value) || 0;
    const lvESV = parseFloat(document.getElementById('lvESV').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;

    // iEDV (Индексированный КДО) - вынесен из блока проверки КСО
    const iedvInput = document.getElementById('iedv');
    if (lvEDV > 0 && bsa > 0) {
        const iedv = (lvEDV / bsa).toFixed(1);
        if (iedvInput) iedvInput.value = iedv;
        console.log('✅ iEDV рассчитан:', iedv);
    } else if (iedvInput) {
        iedvInput.value = '';
    }

    if (lvEDV > 0 && lvESV > 0 && lvEDV > lvESV) {
        const lvSV = (lvEDV - lvESV).toFixed(1);
        const lvEF = ((lvSV / lvEDV) * 100).toFixed(1);

        const svInput = document.getElementById('lvSV');
        if (svInput) svInput.value = lvSV;
        const efInput = document.getElementById('lvEFSimpson');
        if (efInput) efInput.value = lvEF;

        console.log('✅ Simpson параметры рассчитаны: SV=', lvSV, 'EF=', lvEF);
    } else {
        const svInput = document.getElementById('lvSV');
        if (svInput) svInput.value = '';
        const efInput = document.getElementById('lvEFSimpson');
        if (efInput) efInput.value = '';
    }

    // Пересчет Z-score
    if (typeof calculateAllZScores === 'function') {
        setTimeout(() => {
            console.log('📈 Пересчет Z-score после Simpson расчета');
            calculateAllZScores();
        }, 100);
    }
}

// ===== РАСЧЕТ ГРАДИЕНТА ДЛЯ КЛАПАНА АОРТЫ (BERNOULLI / MODIFIED BERNOULLI) =====
function calculateAorticGradient() {
    const v2 = parseFloat(document.getElementById('aorticVmax')?.value) || 0;
    const v1 = parseFloat(document.getElementById('lvotVmax_aov')?.value) || 0;
    const pgOutput = document.getElementById('aorticPeakGradient');
    
    if (v2 > 0) {
        let gradient;
        if (v1 > 0) {
            // Модифицированное уравнение Бернулли: ΔP = 4 x [(V2)^2 − (V1)^2]
            gradient = 4 * (Math.pow(v2, 2) - Math.pow(v1, 2));
            if (gradient < 0) gradient = 0;
            console.log('✅ Модифицированный градиент Ао рассчитан:', gradient.toFixed(1));
        } else {
            // Стандартное уравнение Бернулли: PG = 4 x (V2)^2
            gradient = 4 * Math.pow(v2, 2);
            console.log('✅ Стандартный градиент Ао рассчитан:', gradient.toFixed(1));
        }
        
        if (pgOutput) pgOutput.value = gradient.toFixed(1);
    } else if (pgOutput) {
        pgOutput.value = '';
    }
}

// ===== РАСЧЕТ ГРАДИЕНТОВ (УРАВНЕНИЕ БЕРНУЛЛИ 4V²) =====
function calculateLVOT() {
    const vmax = parseFloat(document.getElementById('lvotVmax').value) || 0;
    const v1 = parseFloat(document.getElementById('lvotV1').value) || 0;
    const v2 = parseFloat(document.getElementById('lvotV2').value) || 0;

    if (vmax > 0) {
        const pg = 4 * Math.pow(vmax, 2);
        const pgInput = document.getElementById('lvotPg');
        if (pgInput) pgInput.value = pg.toFixed(1);
    } else {
        const pgInput = document.getElementById('lvotPg');
        if (pgInput) pgInput.value = '';
    }

    if (v1 > 0 && v2 > 0) {
        const modifiedPg = 4 * (Math.pow(v2, 2) - Math.pow(v1, 2));
        const modifiedPgInput = document.getElementById('lvotModifiedPg');
        if (modifiedPgInput) modifiedPgInput.value = modifiedPg.toFixed(1);
    } else {
        const modifiedPgInput = document.getElementById('lvotModifiedPg');
        if (modifiedPgInput) modifiedPgInput.value = '';
    }
}

// ===== РАСЧЕТ E/Vp =====
function calculateEVp() {
    const ve = parseFloat(document.getElementById('ve').value) || 0;
    const vp = parseFloat(document.getElementById('vp_cm_s').value) || 0;

    if (ve > 0 && vp > 0) {
        const evpRatio = (ve * 100) / vp;
        const evpRatioInput = document.getElementById('e_vp_ratio');
        if (evpRatioInput) evpRatioInput.value = evpRatio.toFixed(1);
    } else {
        const evpRatioInput = document.getElementById('e_vp_ratio');
        if (evpRatioInput) evpRatioInput.value = '';
    }
}

// ===== РАСЧЕТ ОТНОШЕНИЙ E/A И E/e' =====
// Функция расчета E/A (остается без изменений, вызывается из app.js)
function calculateEA() {
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
}

// Функция расчета E/e' (ОБНОВЛЕНА: использует среднее арифметическое e' septal и lateral)
function calculateEe() {
    const ve = parseFloat(document.getElementById('ve').value) || 0;
    const eSeptal = parseFloat(document.getElementById('e_septal').value) || 0;
    const eLateral = parseFloat(document.getElementById('e_lateral').value) || 0;
    
    // Преобразуем ve из м/с в см/с (умножаем на 100)
    const ve_cm_s = ve * 100;
    
    // Определяем знаменатель: среднее значение, если оба e' введены, иначе доступное значение
    let eAvg;
    if (eSeptal > 0 && eLateral > 0) {
        eAvg = (eSeptal + eLateral) / 2;
    } else if (eSeptal > 0) {
        eAvg = eSeptal;
    } else if (eLateral > 0) {
        eAvg = eLateral;
    } else {
        eAvg = 0;
    }
    
    const e_e_main = document.getElementById('e_e_ratio');
    const e_e_diast = document.getElementById('e_e_ratio_diast');
    
    if (ve > 0 && eAvg > 0) {
        const e_e_ratio = (ve_cm_s / eAvg).toFixed(1);
        if (e_e_main) e_e_main.value = e_e_ratio;
        if (e_e_diast) e_e_diast.value = e_e_ratio;
        console.log(`✅ E/e' рассчитано: ${e_e_ratio}`);
    } else {
        if (e_e_main) e_e_main.value = '';
        if (e_e_diast) e_e_diast.value = '';
    }
    
    // Также пересчитываем E/Vp если есть Vp
    calculateEVp();
}

// Функция расчета E/Vp
function calculateEVp() {
    const ve = parseFloat(document.getElementById('ve').value) || 0;
    const vp = parseFloat(document.getElementById('vp_cm_s')?.value) || 0;
    
    if (ve > 0 && vp > 0) {
        const ve_cm_s = ve * 100;
        const e_vp_ratio = (ve_cm_s / vp).toFixed(1);
        const e_vp_input = document.getElementById('e_vp_ratio');
        if (e_vp_input) e_vp_input.value = e_vp_ratio;
        console.log('✅ E/Vp рассчитано:', e_vp_ratio);
    } else {
        const e_vp_input = document.getElementById('e_vp_ratio');
        if (e_vp_input) e_vp_input.value = '';
    }
}

// ===== РАСЧЕТ ГРАДИЕНТОВ (УРАВНЕНИЕ БЕРНУЛЛИ 4V²) =====
function calculateGradient(valveType) {
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
}

function calculateRegurgGradient(valveType) {
    if (valveType === 'tv') {
        const vmax = parseFloat(document.getElementById('tvRegurgVmax').value) || 0;
        if (vmax > 0) {
            const gradient = (4 * Math.pow(vmax, 2)).toFixed(1);
            document.getElementById('tvRegurgGradient').value = gradient;
            console.log('✅ Градиент регургитации ТК рассчитан:', gradient);
        } else {
            document.getElementById('tvRegurgGradient').value = '';
        }
    }
}

// ===== РАСЧЕТ УДАРНОГО ОБЪЕМА, СЕРДЕЧНОГО ВЫБРОСА И ИНДЕКСА =====
function calculateSV() {
    const diameter = parseFloat(document.getElementById('vtlzhDiameter').value) || 0;
    const vti = parseFloat(document.getElementById('vtlzhVTI').value) || 0;
    
    if (diameter > 0 && vti > 0) {
        const radius = diameter / 2;
        const area = Math.PI * Math.pow(radius, 2);
        const sv = (area * vti).toFixed(1);
        document.getElementById('svVTLZH').value = sv;
        console.log('✅ УО рассчитан:', sv, 'мл');
    } else {
        document.getElementById('svVTLZH').value = '';
    }
}

function calculateHemodynamics() {
    const sv = parseFloat(document.getElementById('svVTLZH').value) || 0;
    const hr = parseFloat(document.getElementById('hr').value) || 0;
    const bsa = parseFloat(document.getElementById('bsa').value) || 0;
    
    if (sv > 0 && hr > 0) {
        const co = (sv * hr / 1000).toFixed(2);
        document.getElementById('coVTLZH').value = co;
        
        if (bsa > 0) {
            const ci = (co / bsa).toFixed(2);
            document.getElementById('ciVTLZH').value = ci;
            console.log(`✅ Гемодинамика: СВ=${co} л/мин, СИ=${ci} л/мин/м²`);
        } else {
            document.getElementById('ciVTLZH').value = '';
            console.log(`✅ СВ рассчитан: ${co} л/мин (для СИ нужна ППТ)`);
        }
    } else {
        document.getElementById('coVTLZH').value = '';
        document.getElementById('ciVTLZH').value = '';
    }
}

// ===== ДИАСТОЛИЧЕСКАЯ ФУНКЦИЯ ЛЖ =====
function calculateDiastolicLV() {
    console.log('📊 calculateDiastolicLV вызвана');
    
    // 1. Ar-A duration
    const mitralDuration = parseFloat(document.getElementById('mitralADuration').value) || 0;
    const pulmonaryDuration = parseFloat(document.getElementById('pulmonaryArDuration').value) || 0;
    if (mitralDuration > 0 && pulmonaryDuration > 0) {
        document.getElementById('arADuration').value = (pulmonaryDuration - mitralDuration).toFixed(1);
    } else {
        document.getElementById('arADuration').value = '';
    }

    // 2. TE-e'
    const te = parseFloat(document.getElementById('te_ms').value) || 0;
    const te_prime = parseFloat(document.getElementById('te_prime_ms').value) || 0;
    let te_e_diff = 0;
    if (te > 0 && te_prime > 0) {
        te_e_diff = te_prime - te;
        document.getElementById('te_e_prime_diff').value = te_e_diff.toFixed(1);
    } else {
        document.getElementById('te_e_prime_diff').value = '';
    }

    // 3. IVRT/TE-e'
    const ivrt = parseFloat(document.getElementById('ivrt_ms').value) || 0;
    if (ivrt > 0 && te_e_diff !== 0) {
        document.getElementById('ivrt_te_e_ratio').value = (ivrt / te_e_diff).toFixed(2);
    } else {
        document.getElementById('ivrt_te_e_ratio').value = '';
    }
}

// ===== РАСЧЕТ ДАВЛЕНИЯ В ЛЕГОЧНОЙ АРТЕРИИ =====
function calculatePAP() {
    const cvp = parseFloat(document.getElementById('cvpValue').value) || 0;
    const gradient = parseFloat(document.getElementById('tvRegurgGradient').value) || 0;
    
    if (gradient > 0) {
        const pap = (gradient + cvp).toFixed(1);
        document.getElementById('papValue').value = pap;
        console.log('✅ Давление в ЛА рассчитано:', pap, 'mmHg');
    } else {
        document.getElementById('papValue').value = '';
    }
}

// ===== НОВЫЕ РАСЧЕТЫ РЕГУРГИТАЦИИ И QP/QS =====
function calculateMitralAndRegurg() {
    console.log('🔄 Запуск расчетов регургитации...');
    
    // 1. УО ВТЛЖ (уже должен быть рассчитан в calculateSV)
    const svVTLZH = parseFloat(document.getElementById('svVTLZH').value) || 0;
    
    // 2. УО Митрального клапана
    const mvDiamMM = parseFloat(document.getElementById('mvAnnulusDiam').value) || 0;
    const mvVTI = parseFloat(document.getElementById('mvVTI').value) || 0;
    
    let svMitral = 0;
    if (mvDiamMM > 0 && mvVTI > 0) {
        const mvDiamCM = mvDiamMM / 10;
        const mvRadius = mvDiamCM / 2;
        const mvArea = Math.PI * Math.pow(mvRadius, 2);
        svMitral = mvArea * mvVTI; // в мл
        console.log('✅ УО Митральный рассчитан:', svMitral.toFixed(1), 'мл');
    }

    // 3. Объем и фракция регургитации (Митральный клапан)
    if (svMitral > 0 && svVTLZH > 0) {
        // Митральная регургитация: УО МК - УО ВТЛЖ
        const mvRegurgVol = Math.max(0, svMitral - svVTLZH);
        const mvRegurgFrac = (mvRegurgVol / svMitral) * 100;
        
        document.getElementById('mvRegurgVol').value = mvRegurgVol.toFixed(1);
        document.getElementById('mvRegurgFrac').value = mvRegurgFrac.toFixed(1);
        
        // Аортальная регургитация: УО ВТЛЖ - УО МК
        const avRegurgVol = Math.max(0, svVTLZH - svMitral);
        const avRegurgFrac = (avRegurgVol / svVTLZH) * 100;
        
        document.getElementById('avRegurgVol').value = avRegurgVol.toFixed(1);
        document.getElementById('avRegurgFrac').value = avRegurgFrac.toFixed(1);

        // Qp/Qs: УО МК / УО ВТЛЖ
        const qpQs = svMitral / svVTLZH;
        document.getElementById('qpQs').value = qpQs.toFixed(2);
        
        console.log('✅ Расчеты регургитации завершены');
    } else {
        document.getElementById('mvRegurgVol').value = '';
        document.getElementById('mvRegurgFrac').value = '';
        document.getElementById('avRegurgVol').value = '';
        document.getElementById('avRegurgFrac').value = '';
        document.getElementById('qpQs').value = '';
    }
}

// Функция переключения видимости (нужна для новых чекбоксов)
function toggleFieldVisibility(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = container.style.display === 'none' ? 'flex' : 'none';
    }
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
function updateWeight() {
    const weightG = parseFloat(document.getElementById('weight_g').value);
    if (weightG >= 1000) {
        const extraKg = Math.floor(weightG / 1000);
        const remainingG = weightG % 1000;
        
        const weightKgInput = document.getElementById('weight_kg');
        weightKgInput.value = (parseFloat(weightKgInput.value) || 0) + extraKg;
        document.getElementById('weight_g').value = remainingG;
    }
    calculateAnthropometry();
}

// ===== ЭКСПОРТ ВСЕХ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА =====
// Эти функции будут доступны из других модулей (app.js, index.html)
window.calculateBSAHaycock = calculateBSAHaycock;
window.calculateAnthropometry = calculateAnthropometry;
window.calculateAllZScores = calculateAllZScores;
window.calculateLAIndex = calculateLAIndex;
window.calculateRAIndex = calculateRAIndex;
window.calculateRVFAC = calculateRVFAC;
window.calculateLVParameters = calculateLVParameters;
window.calculateSimpsonParameters = calculateSimpsonParameters;
window.calculateEA = calculateEA;
window.calculateEe = calculateEe;
window.calculateGradient = calculateGradient;
window.calculateRegurgGradient = calculateRegurgGradient;
window.calculateSV = calculateSV;
window.calculateHemodynamics = calculateHemodynamics;
window.calculatePAP = calculatePAP;
window.updateWeight = updateWeight;
window.updateZScoreElement = updateZScoreElement;
window.clearZScoreElement = clearZScoreElement;
window.clearAllZScoreFields = clearAllZScoreFields;

console.log('✅ calculations.js загружен! Все функции доступны:');
console.log('- calculateBSAHaycock:', typeof calculateBSAHaycock);
console.log('- calculateAnthropometry:', typeof calculateAnthropometry);
console.log('- calculateAllZScores:', typeof calculateAllZScores);
console.log('- calculateEe (обновленная):', typeof calculateEe);
