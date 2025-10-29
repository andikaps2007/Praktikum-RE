document.addEventListener('DOMContentLoaded', () => {
    const trainerBoard = document.getElementById('trainer-board');
    const voltageDisplay = document.getElementById('voltage-display');
    const currentDisplay = document.getElementById('current-display');
    const modeSwitch = document.getElementById('mode-switch');
    const meterNeedle = document.getElementById('meter-needle');

    const ROWS = 10;
    const COLS = 10;
    
    // Status Logic
    let selectedComponent = null;
    let connectionStartCell = null;
    let meterPoints = [];
    let meterMode = 'VOLTAGE'; // 'VOLTAGE' atau 'CURRENT'

    // --- 1. SETUP BOARD DAN EVENT LISTENERS ---

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('board-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            trainerBoard.appendChild(cell);

            // Event Listeners
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            cell.addEventListener('click', handleClickCell); 
        }
    }

    // Event listener untuk komponen yang bisa diseret
    document.querySelectorAll('.component').forEach(comp => {
        comp.addEventListener('dragstart', handleDragStart);
    });
    
    // Event listener untuk pengubah mode meter
    modeSwitch.addEventListener('click', () => {
        if (meterMode === 'VOLTAGE') {
            meterMode = 'CURRENT';
            modeSwitch.textContent = "Mode: Arus (A)";
        } else {
            meterMode = 'VOLTAGE';
            modeSwitch.textContent = "Mode: Tegangan (V)";
        }
        meterPoints = []; // Reset pengukuran
        updateMeterDisplay(0, 0);
    });

    // --- 2. LOGIKA DRAG AND DROP ---
    
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'copy';
        selectedComponent = e.target.cloneNode(true); 
        selectedComponent.classList.add('component-instance'); 
        selectedComponent.removeAttribute('draggable'); 
        selectedComponent.style.cursor = 'default';
        selectedComponent.textContent = e.target.dataset.type === 'supply' ? '9V' : e.target.textContent;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.target.classList.add('highlight');
    }

    function handleDragLeave(e) {
        e.target.classList.remove('highlight');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('highlight');

        if (e.target.children.length === 0 && selectedComponent) {
            e.target.appendChild(selectedComponent);
            selectedComponent = null; 
            calculateCircuit(); // Hitung ulang setelah komponen diletakkan
        }
    }

    // --- 3. LOGIKA KABEL DAN PENGUKURAN ---

    function handleClickCell(e) {
        const cell = e.currentTarget;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);

        // Prioritas 1: Logika Pembuatan Kabel
        if (connectionStartCell && connectionStartCell !== cell) {
            const startR = parseInt(connectionStartCell.dataset.row);
            const startC = parseInt(connectionStartCell.dataset.col);

            const isHorizontal = startR === r && Math.abs(startC - c) > 0;
            const isVertical = startC === c && Math.abs(startR - r) > 0;

            if (isHorizontal || isVertical) {
                createWireVisual(connectionStartCell, cell, isHorizontal);
                
                // Simpan koneksi di dataset (Sangat penting untuk logika sirkuit)
                connectionStartCell.dataset.connected = cell.dataset.row + ',' + cell.dataset.col;
                cell.dataset.connected = connectionStartCell.dataset.row + ',' + connectionStartCell.dataset.col;

                connectionStartCell.classList.remove('connecting');
                connectionStartCell = null;
                calculateCircuit(); // Hitung ulang setelah kabel dipasang
                return;
            } else {
                 connectionStartCell.classList.remove('connecting');
                 connectionStartCell = null;
                 alert("Koneksi harus horizontal atau vertikal lurus.");
                 return;
            }
            
        } else if (connectionStartCell === cell) {
             // Klik dua kali pada sel yang sama membatalkan koneksi
             connectionStartCell.classList.remove('connecting');
             connectionStartCell = null;
             return;
        }


        // Prioritas 2: Logika Pengukuran
        if (!connectionStartCell) {
             if (meterPoints.length < 2) {
                meterPoints.push(cell);
                cell.classList.add('meter-probe'); 
            }

            if (meterPoints.length === 2) {
                const [p1, p2] = meterPoints;
                const result = performMeasurement(p1, p2, meterMode);

                updateMeterDisplay(result.V, result.I);

                // Reset setelah penundaan (simulasi proses pengukuran)
                setTimeout(() => {
                    p1.classList.remove('meter-probe');
                    p2.classList.remove('meter-probe');
                    meterPoints = [];
                    updateMeterDisplay(0, 0);
                }, 3000); 
            }
        }
        
        // Klik pertama untuk kabel
        if (!connectionStartCell && meterPoints.length === 0) {
            connectionStartCell = cell;
            cell.classList.add('connecting');
        }
    }
    
    function createWireVisual(cell1, cell2, isHorizontal) {
        const wireIndicator = document.createElement('div');
        wireIndicator.classList.add('wire-indicator');
        wireIndicator.classList.add(isHorizontal ? 'horizontal' : 'vertical');
        
        // Agar terlihat seperti kabel antar 2 titik
        cell1.appendChild(wireIndicator.cloneNode(true));
        cell2.appendChild(wireIndicator.cloneNode(true)); 
    }
    
    // --- 4. LOGIKA PERHITUNGAN DUMMY (Menggantikan MNA) ---

    // Placeholder untuk menghitung sirkuit (MNA)
    function calculateCircuit() {
        // Di sini seharusnya ada algoritma MNA yang sangat kompleks untuk menghitung 
        // semua tegangan node dan arus cabang (termasuk Seri, Paralel, dan Superposisi).
        console.log("Sirkuit diubah. Perhitungan (Dummy) siap.");
    }
    
    /**
     * FUNGSI PENGUKURAN DUMMY:
     * Ini mensimulasikan hasil pengukuran untuk rangkaian sederhana.
     * Untuk rangkaian yang kompleks, Anda harus mengimplementasikan MNA di 'calculateCircuit'.
     */
    function performMeasurement(p1, p2, mode) {
        let V = 0;
        let I = 0; // dalam Amperes
        const SupplyV = 9;
        const R1 = 1000; // 1k
        const R2 = 2000; // 2k

        // Temukan semua komponen dan node untuk perhitungan sederhana
        const allCells = trainerBoard.querySelectorAll('.board-cell');
        const supplyCell = Array.from(allCells).find(c => c.querySelector('[data-type="supply"]'));
        const resistorCells = Array.from(allCells).filter(c => c.querySelector('[data-type="resistor"]'));
        
        // Skenario Paling Sederhana: Seri
        if (resistorCells.length === 2 && supplyCell) {
            // Asumsi: Jika 2 resistor dan 1 supply terhubung dalam jalur, anggap seri
            const R_total = R1 + R2;
            const I_total = SupplyV / R_total; // Hukum Ohm
            
            if (mode === 'VOLTAGE') {
                // Pengukuran Tegangan di Sumber
                if (isCellConnected(p1, supplyCell) || isCellConnected(p2, supplyCell)) {
                     V = SupplyV;
                } else if (isCellConnectedToResistor(p1, R1) && isCellConnectedToResistor(p2, R2)) {
                     // Pengukuran di seluruh rangkaian seri
                     V = SupplyV;
                } else {
                     // Tegangan di Resistor 1k (V = I * R)
                     V = I_total * R1; 
                }
            } else {
                // Pengukuran Arus (selalu sama dalam rangkaian seri)
                I = I_total;
            }
        } 
        
        // Jika tidak ada sirkuit yang jelas, berikan nilai sederhana
        if (V === 0 && I === 0) {
            if (mode === 'VOLTAGE') {
                V = Math.random() * 9; 
            } else {
                I = Math.random() * 0.005; // maks 5mA
            }
        }

        return { V: V, I: I * 1000 }; // I dikembalikan dalam mA
    }
    
    // Fungsi bantu (dummy)
    function isCellConnected(cell1, cell2) {
        return cell1 === cell2 || cell1.dataset.connected === (cell2.dataset.row + ',' + cell2.dataset.col);
    }
    function isCellConnectedToResistor(cell, R_value) {
        const comp = cell.querySelector('[data-type="resistor"]');
        return comp && parseFloat(comp.dataset.value) === R_value;
    }

    // --- 5. TAMPILAN METER ---

    function updateMeterDisplay(V, I_mA) {
        voltageDisplay.textContent = V.toFixed(2);
        currentDisplay.textContent = I_mA.toFixed(2);
        
        // Visualisasi Jarum Analog
        const maxReading = meterMode === 'VOLTAGE' ? 10 : 20; // Skala maks V/mA
        const currentValue = meterMode === 'VOLTAGE' ? V : I_mA;
        
        // Peta nilai (0 hingga maks) ke sudut (-135deg hingga 135deg)
        let angle = -135 + (currentValue / maxReading) * 270;
        angle = Math.max(-135, Math.min(135, angle)); // Batasi agar tidak berputar penuh
        
        meterNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
    
    // Inisialisasi tampilan
    updateMeterDisplay(0, 0);
});
