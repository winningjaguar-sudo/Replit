// Референсные значения 10-го центиля (Cantinotti 2016)
const DIASTOLIC_REFERENCES = {
    'e_septal': [
        { age_days_max: 30, value: 5.5 },
        { age_days_max: 365, value: 6.9 },
        { age_days_max: 1825, value: 12.0 },
        { age_days_max: 3285, value: 12.3 },
        { age_days_max: 4745, value: 11.7 },
        { age_days_max: 6570, value: 12.5 }
    ],
    'e_lateral': [
        { age_days_max: 30, value: 5.6 },
        { age_days_max: 365, value: 8.1 },
        { age_days_max: 1825, value: 12.7 },
        { age_days_max: 3285, value: 13.4 },
        { age_days_max: 4745, value: 14.3 },
        { age_days_max: 6570, value: 14.1 }
    ],
    'e_e_ratio': [
        { age_days_max: 30, value: 13.5 },   // 0–30 days (было 13.4 + 0.1)
        { age_days_max: 365, value: 14.5 },  // 1–12 months (было 14.4 + 0.1)
        { age_days_max: 1825, value: 9.1 },   // 1–5 years (было 9.0 + 0.1)
        { age_days_max: 3285, value: 9.0 },   // 6–9 years (было 8.9 + 0.1)
        { age_days_max: 4745, value: 9.4 },   // 10–13 years (было 9.3 + 0.1)
        { age_days_max: 6570, value: 9.4 }    // 14–18 years (было 9.3 + 0.1 — для 13.4 было 9.4)
    ]
};

/**
 * Оценивает значение параметра относительно 10-го центиля
 */
function evaluateDiastolicValue(paramId, measurement) {
    if (!measurement || measurement <= 0) return '';
    
    const birthDateValue = document.getElementById('birthDate')?.value;
    if (!birthDateValue) return '';
    
    const birthDate = new Date(birthDateValue);
    const today = new Date();
    const ageDiffMs = today - birthDate;
    const ageDays = ageDiffMs / (1000 * 60 * 60 * 24);
    
    if (ageDays < 0) return '';
    
    const ref = DIASTOLIC_REFERENCES[paramId];
    if (!ref) return '';
    
    // Находим соответствующую возрастную группу
    const group = ref.find(g => ageDays <= g.age_days_max) || ref[ref.length - 1];
    
    if (measurement < group.value) {
        return "Ниже 10-го центиля";
    } else {
        return "в пределах нормы";
    }
}

/**
 * Расчет параметров диастолической функции ЛЖ
 */
window.calculateDiastolicLV = function() {
    console.log('🔁 Расчет диастолической функции ЛЖ');
    
    // 1. Отношение E/A
    const ve = parseFloat(document.getElementById('ve')?.value) || 0;
    const va = parseFloat(document.getElementById('va')?.value) || 0;
    if (ve > 0 && va > 0) {
        document.getElementById('e_a_ratio').value = (ve / va).toFixed(2);
    } else {
        document.getElementById('e_a_ratio').value = '';
    }

    // 2. Отношение E/e' (среднее)
    const e_septal = parseFloat(document.getElementById('e_septal')?.value) || 0;
    const e_lateral = parseFloat(document.getElementById('e_lateral')?.value) || 0;
    
    // Оценка e' septal
    const e_septal_eval = document.getElementById('e_septal_evaluation');
    const e_septal_eval_diast = document.getElementById('e_septal_evaluation_diast');
    const e_septal_val_diast = document.getElementById('e_septal_val_diast');
    const eval_s = evaluateDiastolicValue('e_septal', e_septal);
    
    if (e_septal_val_diast) e_septal_val_diast.value = e_septal > 0 ? e_septal : '';
    
    if (e_septal_eval) {
        e_septal_eval.textContent = eval_s;
        e_septal_eval.style.color = eval_s.includes('Ниже') ? '#e74c3c' : '#28a745';
        e_septal_eval.style.fontWeight = eval_s.includes('Ниже') ? 'bold' : 'normal';
    }
    if (e_septal_eval_diast) {
        e_septal_eval_diast.textContent = eval_s;
        e_septal_eval_diast.style.color = eval_s.includes('Ниже') ? '#e74c3c' : '#28a745';
        e_septal_eval_diast.style.fontWeight = eval_s.includes('Ниже') ? 'bold' : 'normal';
    }
    
    // Оценка e' lateral
    const e_lateral_eval = document.getElementById('e_lateral_evaluation');
    const e_lateral_eval_diast = document.getElementById('e_lateral_evaluation_diast');
    const e_lateral_val_diast = document.getElementById('e_lateral_val_diast');
    const eval_l = evaluateDiastolicValue('e_lateral', e_lateral);
    
    if (e_lateral_val_diast) e_lateral_val_diast.value = e_lateral > 0 ? e_lateral : '';
    
    if (e_lateral_eval) {
        e_lateral_eval.textContent = eval_l;
        e_lateral_eval.style.color = eval_l.includes('Ниже') ? '#e74c3c' : '#28a745';
        e_lateral_eval.style.fontWeight = eval_l.includes('Ниже') ? 'bold' : 'normal';
    }
    if (e_lateral_eval_diast) {
        e_lateral_eval_diast.textContent = eval_l;
        e_lateral_eval_diast.style.color = eval_l.includes('Ниже') ? '#e74c3c' : '#28a745';
        e_lateral_eval_diast.style.fontWeight = eval_l.includes('Ниже') ? 'bold' : 'normal';
    }
    
    if (ve > 0) {
        let e_prime_sum = 0;
        let count = 0;
        if (e_septal > 0) { e_prime_sum += e_septal; count++; }
        if (e_lateral > 0) { e_prime_sum += e_lateral; count++; }
        
        if (count > 0) {
            const e_prime_avg = e_prime_sum / count;
            const ve_cm = ve < 5 ? ve * 100 : ve;
            const ratio = (ve_cm / e_prime_avg);
            const ratioStr = ratio.toFixed(1);
            
            // Обновляем оба поля E/e'
            if (document.getElementById('e_e_ratio')) document.getElementById('e_e_ratio').value = ratioStr;
            if (document.getElementById('e_e_ratio_mitral')) document.getElementById('e_e_ratio_mitral').value = ratioStr;
            
            // Оценка E/e'
            const ee_eval_main = document.getElementById('e_e_evaluation');
            const ee_eval_diast = document.getElementById('e_e_evaluation_diast');
            
            const birthDateValue = document.getElementById('birthDate')?.value;
            let evalText = '';
            let isAbnormal = false;

            if (birthDateValue && ratio > 0) {
                const birthDate = new Date(birthDateValue);
                const today = new Date();
                const ageDays = (today - birthDate) / (1000 * 60 * 60 * 24);
                const ref = DIASTOLIC_REFERENCES['e_e_ratio'];
                const group = ref.find(g => ageDays <= g.age_days_max) || ref[ref.length - 1];
                
                if (ratio >= 14) {
                    evalText = "выраженное превышение";
                    isAbnormal = true;
                } else if (ratio > group.value) {
                    evalText = "Выше нормы";
                    isAbnormal = true;
                } else {
                    evalText = "в пределах нормы";
                }
            }
            
            // Применяем оценку к обоим элементам
            [ee_eval_main, ee_eval_diast].forEach(el => {
                if (el) {
                    el.textContent = evalText;
                    el.style.color = isAbnormal ? '#e74c3c' : '#28a745';
                    el.style.fontWeight = isAbnormal ? 'bold' : 'normal';
                }
            });
        } else {
            if (document.getElementById('e_e_ratio')) document.getElementById('e_e_ratio').value = '';
            if (document.getElementById('e_e_ratio_mitral')) document.getElementById('e_e_ratio_mitral').value = '';
            const ee_eval_main = document.getElementById('e_e_evaluation');
            const ee_eval_diast = document.getElementById('e_e_evaluation_diast');
            if (ee_eval_main) ee_eval_main.textContent = '';
            if (ee_eval_diast) ee_eval_diast.textContent = '';
        }
    } else {
        if (document.getElementById('e_e_ratio')) document.getElementById('e_e_ratio').value = '';
        if (document.getElementById('e_e_ratio_mitral')) document.getElementById('e_e_ratio_mitral').value = '';
        const ee_eval_main = document.getElementById('e_e_evaluation');
        const ee_eval_diast = document.getElementById('e_e_evaluation_diast');
        if (ee_eval_main) ee_eval_main.textContent = '';
        if (ee_eval_diast) ee_eval_diast.textContent = '';
    }

    // 3. Ar-A duration
    const mitralA = parseFloat(document.getElementById('mitralADuration')?.value) || 0;
    const pulmonaryAr = parseFloat(document.getElementById('pulmonaryArDuration')?.value) || 0;
    if (mitralA > 0 && pulmonaryAr > 0) {
        document.getElementById('arADuration').value = (pulmonaryAr - mitralA).toFixed(0);
    } else {
        document.getElementById('arADuration').value = '';
    }

    // 4. TE-e'
    const te = parseFloat(document.getElementById('te_ms')?.value) || 0;
    const te_prime = parseFloat(document.getElementById('te_prime_ms')?.value) || 0;
    if (te > 0 && te_prime > 0) {
        const diff = te_prime - te;
        document.getElementById('te_e_prime_diff').value = diff.toFixed(0);
        
        // 5. IVRT/TE-e'
        const ivrt = parseFloat(document.getElementById('ivrt_ms')?.value) || 0;
        if (ivrt > 0 && diff !== 0) {
            document.getElementById('ivrt_te_e_ratio').value = (ivrt / diff).toFixed(2);
        } else {
            document.getElementById('ivrt_te_e_ratio').value = '';
        }
    } else {
        document.getElementById('te_e_prime_diff').value = '';
        document.getElementById('ivrt_te_e_ratio').value = '';
    }
};

// Регистрация функций в глобальной области
window.toggleDiastolicBlock = function() {
    const checkbox = document.getElementById('diastolicFunctionCheckbox');
    const content = document.getElementById('diastolicContent');
    const placeholder = document.getElementById('diastolicBlockPlaceholder');
    const wrapper = document.getElementById('diastolicContentWrapper');
    
    if (checkbox) {
        if (content) content.style.display = checkbox.checked ? 'block' : 'none';
        
        if (placeholder && wrapper) {
            if (checkbox.checked) {
                placeholder.innerHTML = wrapper.innerHTML;
                placeholder.style.display = 'block';
                // Пересчитываем значения, чтобы копирование сработало
                calculateDiastolicLV();
            } else {
                placeholder.style.display = 'none';
                placeholder.innerHTML = '';
            }
        }
    }
};

window.toggleVisibility = function(id) {
    const element = document.getElementById(id);
    if (element) {
        const isHidden = element.style.display === 'none';
        element.style.display = isHidden ? 'flex' : 'none';
    }
};

window.toggleEAPComparison = function(type) {
    const selector = document.getElementById(`${type}_selector`);
    const display = document.getElementById(`${type}_sign_display`);
    if (selector && display) {
        selector.style.display = 'inline-block';
        display.style.display = 'none';
        const select = selector.querySelector('select');
        if (select) select.focus();
    }
};

window.updateEAPSign = function(type) {
    const select = document.getElementById(`${type}_sign`);
    const display = document.getElementById(`${type}_sign_display`);
    const selector = document.getElementById(`${type}_selector`);
    if (select && display && selector) {
        display.innerText = select.value || '?';
        selector.style.display = 'none';
        display.style.display = 'inline-block';
    }
};

window.collapseEAPComparison = function(type) {
    const selector = document.getElementById(`${type}_selector`);
    const display = document.getElementById(`${type}_sign_display`);
    if (selector && display) {
        setTimeout(() => {
            selector.style.display = 'none';
            display.style.display = 'inline-block';
        }, 200);
    }
};

console.log('✅ calculations.js расширен функциями диастолы');
