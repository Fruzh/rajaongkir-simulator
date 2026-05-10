const elements = {
    weight: document.getElementById('weight'),
    btnCalculate: document.getElementById('btnCalculate'),
    btnText: document.getElementById('btnText'),
    btnSpinner: document.getElementById('btnSpinner'),
    
    courierView: document.getElementById('courierView'),
    resultsView: document.getElementById('resultsView'),
    btnBackToCouriers: document.getElementById('btnBackToCouriers'),
    
    resultsContainer: document.getElementById('resultsContainer'),
    couriersList: document.getElementById('couriers-list'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

let selectInstances = {};

document.addEventListener('DOMContentLoaded', () => {
    initSlimSelects();
    renderCouriers();
    setupEventListeners();
    loadProvinces();
});

function initSlimSelects() {
    if (typeof SlimSelect === 'undefined') {
        setTimeout(initSlimSelects, 50);
        return;
    }
    
    const config = {
        showSearch: true,
        searchPlaceholder: 'Ketik untuk mencari...',
        searchText: 'Tidak ada data ditemukan.',
        placeholderText: 'Pilih...'
    };

    selectInstances.originProv = new SlimSelect({
        select: '#originProvince',
        settings: config,
        events: {
            afterChange: (newVal) => {
                const val = newVal[0]?.value;
                if (val) loadCities(val, 'origin');
                else resetCascades('origin', ['city', 'dist']);
            }
        }
    });

    selectInstances.originCity = new SlimSelect({
        select: '#originCity',
        settings: config,
        events: {
            afterChange: (newVal) => {
                const val = newVal[0]?.value;
                if (val) loadDistricts(val, 'origin');
                else resetCascades('origin', ['dist']);
            }
        }
    });

    selectInstances.originDist = new SlimSelect({
        select: '#originDistrict',
        settings: config
    });

    selectInstances.destProv = new SlimSelect({
        select: '#destProvince',
        settings: config,
        events: {
            afterChange: (newVal) => {
                const val = newVal[0]?.value;
                if (val) loadCities(val, 'dest');
                else resetCascades('dest', ['city', 'dist']);
            }
        }
    });

    selectInstances.destCity = new SlimSelect({
        select: '#destCity',
        settings: config,
        events: {
            afterChange: (newVal) => {
                const val = newVal[0]?.value;
                if (val) loadDistricts(val, 'dest');
                else resetCascades('dest', ['dist']);
            }
        }
    });

    selectInstances.destDist = new SlimSelect({
        select: '#destDistrict',
        settings: config
    });
}

function renderCouriers() {
    elements.couriersList.innerHTML = COURIERS.map(c => `
        <label class="group relative cursor-pointer">
            <input type="checkbox" value="${c.id}" class="peer sr-only courier-checkbox" checked>
            <div class="flex flex-col items-center justify-center gap-2 p-4 h-24 border-2 border-slate-100 rounded-2xl bg-slate-50/20 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all group-hover:bg-slate-100/50 relative">
                
                <!-- Visual Selected Overlay -->
                <div class="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-all">
                    <div class="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                </div>

                <img src="${c.logo}" alt="${c.name}" 
                     class="h-10 w-auto grayscale opacity-60 transition-all duration-300 object-contain peer-checked:grayscale-0 peer-checked:opacity-100 group-hover:grayscale-0 group-hover:opacity-100">
            </div>
        </label>
    `).join('');
}

function setupEventListeners() {
    elements.btnCalculate.addEventListener('click', handleCalculate);
    elements.btnBackToCouriers.addEventListener('click', () => {
        toggleViews(false);
    });
}

function toggleViews(showResults) {
    if (showResults) {
        elements.courierView.classList.add('hidden');
        elements.resultsView.classList.remove('hidden');
    } else {
        elements.resultsView.classList.add('hidden');
        elements.courierView.classList.remove('hidden');
    }
}

async function apiFetch(endpoint, method = 'GET', bodyData = null, isSilent = false) {
    if (!endpoint) return;
    
    let fullUrl = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: { 'Accept': 'application/json' }
    };

    if (bodyData) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(bodyData);
    }

    try {
        const response = await fetch(fullUrl, options);
        if (!response.ok) {
            throw new Error(`Fetch failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        if (!isSilent) {
            showToast("Oops! Gagal memproses permintaan. Pastikan koneksi server normal.");
        }
        throw error;
    }
}

async function loadProvinces() {
    try {
        const data = await apiFetch('/provinces', 'GET', null, true);
        if (data && data.data) {
            const formattedOptions = [
                { text: 'Pilih Provinsi...', value: '', placeholder: true },
                ...data.data.sort((a,b)=>a.name.localeCompare(b.name)).map(p => ({ text: toTitleCase(p.name), value: p.id }))
            ];
            selectInstances.originProv.setData(formattedOptions);
            selectInstances.destProv.setData(formattedOptions);
        }
    } catch(e) {}
}

async function loadCities(provId, type) {
    if (!provId) return;
    try {
        const inst = selectInstances[`${type}City`];
        inst.disable();
        const data = await apiFetch(`/cities/${provId}`, 'GET', null, true); 
        if (data && data.data) {
            const formatted = [
                { text: 'Pilih Kota/Kabupaten...', value: '', placeholder: true },
                ...data.data.sort((a,b)=>a.name.localeCompare(b.name)).map(c => ({ text: toTitleCase(c.name), value: c.id }))
            ];
            inst.setData(formatted);
            inst.enable();
        }
    } catch(e) {}
}

async function loadDistricts(cityId, type) {
    if (!cityId) return;
    try {
        const inst = selectInstances[`${type}Dist`];
        inst.disable();
        const data = await apiFetch(`/districts/${cityId}`, 'GET', null, true); 
        if (data && data.data) {
            const formatted = [
                { text: 'Pilih Kecamatan...', value: '', placeholder: true },
                ...data.data.sort((a,b)=>a.name.localeCompare(b.name)).map(d => ({ text: toTitleCase(d.name), value: d.id }))
            ];
            inst.setData(formatted);
            inst.enable();
        }
    } catch(e) {}
}

function resetCascades(type, levels) {
    if (levels.includes('city')) {
        selectInstances[`${type}City`].setData([{ text: 'Pilih Kota...', value: '', placeholder: true }]);
        selectInstances[`${type}City`].disable();
    }
    if (levels.includes('dist')) {
        selectInstances[`${type}Dist`].setData([{ text: 'Pilih Kecamatan...', value: '', placeholder: true }]);
        selectInstances[`${type}Dist`].disable();
    }
}

async function handleCalculate() {
    const originVal = String(selectInstances.originDist.getSelected()[0] || '').trim();
    const destVal = String(selectInstances.destDist.getSelected()[0] || '').trim();
    const weight = parseInt(elements.weight.value) || 0;
    
    const selectedCheckboxes = Array.from(document.querySelectorAll('.courier-checkbox:checked'));
    const selectedCouriers = selectedCheckboxes.map(cb => cb.value);

    if (!originVal || !destVal) {
        showToast("Lengkapi rute asal & tujuan!");
        return;
    }
    if (weight < 1) {
        showToast("Berat paket wajib terisi.");
        return;
    }
    if (selectedCouriers.length === 0) {
        showToast("Pilih minimal 1 kurir.");
        return;
    }

    setBtnLoading(true);

    elements.resultsContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <div class="animate-spin h-8 w-8 border-[3px] border-slate-100 border-t-blue-600 rounded-full"></div>
            <p class="text-sm font-bold uppercase tracking-widest text-slate-400">Mencari Tarif Terbaik...</p>
        </div>
    `;

    toggleViews(true);

    try {
        const data = await apiFetch('/cost', 'POST', {
            origin: originVal,
            destination: destVal,
            weight: weight,
            courier: selectedCouriers.join(':')
        }, false); 

        if (data && data.data) {
            renderResults(data.data);
        } else {
            elements.resultsContainer.innerHTML = `
            <div class="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p class="text-slate-500 font-semibold">Data respons kosong.</p>
            </div>`;
        }

    } catch (err) {
        elements.resultsContainer.innerHTML = `
        <div class="p-8 bg-red-50 border border-red-100 rounded-2xl text-center text-red-600">
            <p class="font-bold">Kalkulasi Gagal</p>
            <p class="text-xs mt-1">Silakan coba sesaat lagi atau periksa API Key.</p>
        </div>`;
    } finally {
        setBtnLoading(false);
    }
}

function renderResults(items) {
    if (!items || items.length === 0) {
        elements.resultsContainer.innerHTML = `
        <div class="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <p class="text-slate-500 font-semibold">Layanan kurir tidak didukung di rute ini.</p>
        </div>`;
        return;
    }

    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });

    const validItems = items.filter(it => it.cost !== undefined);
    const sorted = validItems.sort((a, b) => a.cost - b.cost);

    elements.resultsContainer.innerHTML = sorted.map((item, idx) => {
        const info = COURIERS.find(c => c.id === item.code) || {};
        
        return `
        <div class="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-100/30 transition-all group flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300" 
             style="animation-delay: ${idx * 40}ms;">
            
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                    ${info.logo ? `<img src="${info.logo}" class="max-h-full object-contain" />` : '<i data-lucide="package" class="text-slate-400 w-5 h-5"></i>'}
                </div>
                
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <h4 class="font-bold text-slate-800 text-sm leading-tight">${item.name}</h4>
                        <span class="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-extrabold uppercase tracking-wider">${item.service}</span>
                    </div>
                    <p class="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                        <i data-lucide="calendar" class="w-3 h-3"></i> Est: ${formatEtd(item.etd)}
                    </p>
                </div>
            </div>

            <div class="text-right shrink-0">
                <div class="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">${formatter.format(item.cost)}</div>
            </div>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function setBtnLoading(loading) {
    elements.btnCalculate.disabled = loading;
    if (loading) {
        elements.btnText.textContent = "Memproses...";
        elements.btnSpinner.classList.remove('hidden');
    } else {
        elements.btnText.textContent = "Cek Ongkos Kirim";
        elements.btnSpinner.classList.add('hidden');
    }
}

function showToast(msg) {
    elements.toastMessage.textContent = msg;
    elements.toast.classList.remove('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
    
    setTimeout(() => {
        elements.toast.classList.add('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
    }, 3500);
}

function toTitleCase(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/(?:^|\s|-)\S/g, function(a) { 
        return a.toUpperCase(); 
    });
}

function formatEtd(etd) {
    if (!etd || etd.toString().trim() === "" || etd === "-") return "N/A";
    
    let val = etd.toString().toLowerCase()
                 .replace(/day/g, '')
                 .replace(/s/g, '')
                 .trim();

    if (val === "0-0" || val === "0") {
        return "Hari Ini";
    }
    
    if (val === "") return "N/A";
    return `${val} Hari`;
}
