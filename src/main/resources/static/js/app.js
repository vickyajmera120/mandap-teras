// ===============================================
// MANDAP BILLING SYSTEM - MAIN APP
// ===============================================

// Global State
let inventoryItems = [];
let customers = [];
let events = [];
let allBills = [];
let allRoles = [];
let allPermissions = [];

// DOM Elements
const loginPage = document.getElementById('login-page');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const navItems = document.querySelectorAll('.nav-item');
const contentPages = document.querySelectorAll('.content-page');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const toast = document.getElementById('toast');

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (authToken && currentUser) {
        showMainApp();
    } else {
        showLoginPage();
    }

    // Setup event listeners
    setupEventListeners();

    // Set today's date for bill
    document.getElementById('bill-date').valueAsDate = new Date();
});

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout button
    logoutBtn.addEventListener('click', logout);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

// =============== AUTHENTICATION ===============
async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        await AuthAPI.login(username, password);
        showMainApp();
        showToast('Welcome back, ' + currentUser.fullName + '!', 'success');
    } catch (error) {
        loginError.textContent = error.message || 'Invalid credentials';
    }
}

function logout() {
    AuthAPI.logout();
    showLoginPage();
}

function showLoginPage() {
    loginPage.classList.add('active');
    mainApp.classList.remove('active');
    document.body.classList.remove('is-admin');
}

function showMainApp() {
    loginPage.classList.remove('active');
    mainApp.classList.add('active');

    // Update user name
    currentUserSpan.textContent = currentUser.fullName;

    // Show admin menu if admin
    if (isAdmin()) {
        document.body.classList.add('is-admin');
    }

    // Load initial data
    loadDashboard();
    loadInitialData();
}

// =============== NAVIGATION ===============
function navigateTo(page) {
    // Update nav active state
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update page visibility
    contentPages.forEach(p => {
        p.classList.toggle('active', p.id === `${page}-page`);
    });

    // Load page data
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'events':
            loadEvents();
            break;
        case 'billing':
            loadBillingPage();
            break;
        case 'bills':
            loadBillsPage();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'users':
            loadUsers();
            break;
        case 'roles':
            loadRoles();
            break;
    }
}

// =============== DATA LOADING ===============
async function loadInitialData() {
    try {
        // Load inventory items
        inventoryItems = await InventoryAPI.getAll();

        // Load customers
        customers = await CustomersAPI.getAll();

        // Load events
        events = await EventsAPI.getAll();

        // Load roles for admin
        if (isAdmin()) {
            allRoles = await RolesAPI.getAll();
            allPermissions = await RolesAPI.getPermissions();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// =============== DASHBOARD ===============
async function loadDashboard() {
    try {
        // Load stats
        const [customersData, eventsData, billsData] = await Promise.all([
            CustomersAPI.getAll(),
            EventsAPI.getAll(),
            BillsAPI.getAll()
        ]);

        customers = customersData;
        events = eventsData;
        allBills = billsData;

        // Update stats
        document.getElementById('stat-customers').textContent = customers.length;
        document.getElementById('stat-events').textContent = events.length;
        document.getElementById('stat-bills').textContent = allBills.length;

        // Calculate total revenue
        const totalRevenue = allBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
        document.getElementById('stat-revenue').textContent = formatCurrency(totalRevenue);

        // Load recent bills
        const recentBills = allBills.slice(0, 5);
        const tbody = document.getElementById('recent-bills-body');
        tbody.innerHTML = recentBills.map(bill => `
            <tr>
                <td>${bill.billNumber}</td>
                <td>${bill.customerName}</td>
                <td>${bill.eventName}</td>
                <td>${formatCurrency(bill.totalAmount)}</td>
                <td>${formatDate(bill.billDate)}</td>
            </tr>
        `).join('');

    } catch (error) {
        showToast('Error loading dashboard', 'error');
    }
}

// =============== CUSTOMERS ===============
async function loadCustomers() {
    try {
        customers = await CustomersAPI.getAll();
        renderCustomersTable(customers);
    } catch (error) {
        showToast('Error loading customers', 'error');
    }
}

function renderCustomersTable(data) {
    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = data.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.mobile}</td>
            <td>${customer.address || '-'}</td>
            <td>${customer.alternateContact || '-'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewCustomerBills(${customer.id})">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function searchCustomers() {
    const query = document.getElementById('customer-search').value;
    if (query.length >= 2) {
        const results = await CustomersAPI.search(query);
        renderCustomersTable(results);
    } else if (query.length === 0) {
        renderCustomersTable(customers);
    }
}

function showCustomerModal(customer = null) {
    modalTitle.textContent = customer ? 'Edit Customer' : 'Add Customer';
    modalContent.innerHTML = `
        <form id="customer-form">
            <input type="hidden" id="customer-id" value="${customer?.id || ''}">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="customer-name" value="${customer?.name || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mobile *</label>
                    <input type="tel" id="customer-mobile" value="${customer?.mobile || ''}" required>
                </div>
                <div class="form-group">
                    <label>Alternate Contact</label>
                    <input type="tel" id="customer-alt-contact" value="${customer?.alternateContact || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea id="customer-address" rows="2">${customer?.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="customer-notes" rows="2">${customer?.notes || ''}</textarea>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    document.getElementById('customer-form').addEventListener('submit', saveCustomer);
    openModal();
}

async function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    showCustomerModal(customer);
}

async function saveCustomer(e) {
    e.preventDefault();

    const id = document.getElementById('customer-id').value;
    const data = {
        name: document.getElementById('customer-name').value,
        mobile: document.getElementById('customer-mobile').value,
        alternateContact: document.getElementById('customer-alt-contact').value,
        address: document.getElementById('customer-address').value,
        notes: document.getElementById('customer-notes').value
    };

    try {
        if (id) {
            await CustomersAPI.update(id, data);
            showToast('Customer updated successfully', 'success');
        } else {
            await CustomersAPI.create(data);
            showToast('Customer created successfully', 'success');
        }
        closeModal();
        loadCustomers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function viewCustomerBills(customerId) {
    navigateTo('bills');
    // Filter bills by customer
    const customerBills = allBills.filter(b => b.customerId === customerId);
    renderBillsTable(customerBills);
}

// =============== EVENTS ===============
async function loadEvents() {
    try {
        events = await EventsAPI.getAll();
        renderEventsTable(events);
    } catch (error) {
        showToast('Error loading events', 'error');
    }
}

function renderEventsTable(data) {
    const tbody = document.getElementById('events-table-body');
    tbody.innerHTML = data.map(event => `
        <tr>
            <td>${event.name}</td>
            <td><span class="badge ${event.type === 'FAGUN_SUD_13' ? 'badge-info' : 'badge-warning'}">${event.type.replace('_', ' ')}</span></td>
            <td>${event.year}</td>
            <td>${event.eventDate || '-'}</td>
            <td>${event.totalPals || '-'}</td>
            <td>-</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editEvent(${event.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewEventBills(${event.id})">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showEventModal(event = null) {
    const currentYear = new Date().getFullYear();
    modalTitle.textContent = event ? 'Edit Event' : 'Create Event';
    modalContent.innerHTML = `
        <form id="event-form">
            <input type="hidden" id="event-id" value="${event?.id || ''}">
            <div class="form-group">
                <label>Event Name *</label>
                <input type="text" id="event-name" value="${event?.name || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Type *</label>
                    <select id="event-type" required>
                        <option value="FAGUN_SUD_13" ${event?.type === 'FAGUN_SUD_13' ? 'selected' : ''}>Fagun Sud 13</option>
                        <option value="NORMAL" ${event?.type === 'NORMAL' ? 'selected' : ''}>Normal Event</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Year *</label>
                    <input type="number" id="event-year" value="${event?.year || currentYear}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Event Date</label>
                    <input type="date" id="event-date" value="${event?.eventDate || ''}">
                </div>
                <div class="form-group">
                    <label>Total Pals</label>
                    <input type="number" id="event-pals" value="${event?.totalPals || 90}">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="event-description" rows="2">${event?.description || ''}</textarea>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    document.getElementById('event-form').addEventListener('submit', saveEvent);
    openModal();
}

async function editEvent(id) {
    const event = events.find(e => e.id === id);
    showEventModal(event);
}

async function saveEvent(e) {
    e.preventDefault();

    const id = document.getElementById('event-id').value;
    const data = {
        name: document.getElementById('event-name').value,
        type: document.getElementById('event-type').value,
        year: parseInt(document.getElementById('event-year').value),
        eventDate: document.getElementById('event-date').value || null,
        totalPals: parseInt(document.getElementById('event-pals').value),
        description: document.getElementById('event-description').value
    };

    try {
        if (id) {
            await EventsAPI.update(id, data);
            showToast('Event updated successfully', 'success');
        } else {
            await EventsAPI.create(data);
            showToast('Event created successfully', 'success');
        }
        closeModal();
        loadEvents();
        loadInitialData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function viewEventBills(eventId) {
    navigateTo('bills');
    const eventBills = await BillsAPI.getByEvent(eventId);
    renderBillsTable(eventBills);
}

// =============== BILLING ===============
async function loadBillingPage() {
    // Populate event dropdown
    const eventSelect = document.getElementById('bill-event');
    eventSelect.innerHTML = '<option value="">Select Event</option>' +
        events.map(e => `<option value="${e.id}" data-type="${e.type}">${e.name} (${e.year})</option>`).join('');

    // Populate customer dropdown
    const customerSelect = document.getElementById('bill-customer');
    customerSelect.innerHTML = '<option value="">Select Customer</option>' +
        customers.map(c => `<option value="${c.id}">${c.name} - ${c.mobile}</option>`).join('');

    // Render inventory items
    renderBillingItems();
}

function renderBillingItems() {
    const leftItems = inventoryItems.filter(i => i.side === 'LEFT');
    const rightItems = inventoryItems.filter(i => i.side === 'RIGHT');

    document.getElementById('left-items').innerHTML = leftItems.map(item => `
        <div class="item-row" data-item-id="${item.id}">
            <div class="item-name">
                <div class="item-name-gujarati">${item.nameGujarati}</div>
                <div class="item-name-english">${item.nameEnglish}</div>
            </div>
            <input type="number" class="item-qty" min="0" value="0" oninput="calculateTotals()">
            <input type="number" class="item-rate" value="${item.defaultRate}" step="0.01" oninput="calculateTotals()">
            <div class="item-total">₹ 0</div>
        </div>
    `).join('');

    document.getElementById('right-items').innerHTML = rightItems.map(item => `
        <div class="item-row" data-item-id="${item.id}">
            <div class="item-name">
                <div class="item-name-gujarati">${item.nameGujarati}</div>
                <div class="item-name-english">${item.nameEnglish}</div>
            </div>
            <input type="number" class="item-qty" min="0" value="0" oninput="calculateTotals()">
            <input type="number" class="item-rate" value="${item.defaultRate}" step="0.01" oninput="calculateTotals()">
            <div class="item-total">₹ 0</div>
        </div>
    `).join('');
}

function onEventChange() {
    const eventSelect = document.getElementById('bill-event');
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const eventType = selectedOption?.dataset?.type;

    // Show/hide pal count based on event type
    const palCountInput = document.getElementById('bill-pal-count');
    if (eventType === 'FAGUN_SUD_13') {
        palCountInput.parentElement.style.display = 'block';
    } else {
        palCountInput.parentElement.style.display = 'none';
    }
}

function calculateTotals() {
    let total = 0;

    document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const itemTotal = qty * rate;
        row.querySelector('.item-total').textContent = formatCurrency(itemTotal);
        total += itemTotal;
    });

    const deposit = parseFloat(document.getElementById('bill-deposit').value) || 0;
    const net = total - deposit;

    document.getElementById('bill-total').textContent = formatCurrency(total);
    document.getElementById('bill-net').textContent = formatCurrency(net);
}

function resetBillForm() {
    document.getElementById('bill-event').value = '';
    document.getElementById('bill-customer').value = '';
    document.getElementById('bill-date').valueAsDate = new Date();
    document.getElementById('bill-pal-count').value = 1;
    document.getElementById('bill-deposit').value = 0;
    document.getElementById('bill-remarks').value = '';

    document.querySelectorAll('.item-qty').forEach(input => input.value = 0);
    calculateTotals();
}

async function saveBill() {
    const eventId = document.getElementById('bill-event').value;
    const customerId = document.getElementById('bill-customer').value;
    const billDate = document.getElementById('bill-date').value;

    if (!eventId || !customerId || !billDate) {
        showToast('Please fill all required fields', 'warning');
        return;
    }

    // Items are optional - collect only items with quantity > 0
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        if (qty > 0) {
            items.push({
                itemId: parseInt(row.dataset.itemId),
                quantity: qty,
                rate: parseFloat(row.querySelector('.item-rate').value)
            });
        }
    });

    // Allow bills with no items (e.g., for Fagun Sud 13 pal-only billing)

    const billData = {
        eventId: parseInt(eventId),
        customerId: parseInt(customerId),
        billDate: billDate,
        palCount: parseInt(document.getElementById('bill-pal-count').value) || 1,
        deposit: parseFloat(document.getElementById('bill-deposit').value) || 0,
        remarks: document.getElementById('bill-remarks').value,
        items: items
    };

    try {
        const savedBill = await BillsAPI.create(billData);
        showToast('Bill created successfully! Bill No: ' + savedBill.billNumber, 'success');
        resetBillForm();

        // Ask if user wants to print
        if (confirm('Bill saved successfully! Do you want to print it?')) {
            printBill(savedBill.id);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// =============== BILLS HISTORY ===============
async function loadBillsPage() {
    try {
        // Load filter dropdowns
        const years = await EventsAPI.getYears();
        document.getElementById('filter-year').innerHTML =
            '<option value="">All Years</option>' +
            years.map(y => `<option value="${y}">${y}</option>`).join('');

        document.getElementById('filter-event').innerHTML =
            '<option value="">All Events</option>' +
            events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

        await loadBills();
    } catch (error) {
        showToast('Error loading bills', 'error');
    }
}

async function loadBills() {
    try {
        const year = document.getElementById('filter-year').value;
        const eventId = document.getElementById('filter-event').value;

        let bills;
        if (year) {
            bills = await BillsAPI.getByYear(parseInt(year));
        } else if (eventId) {
            bills = await BillsAPI.getByEvent(parseInt(eventId));
        } else {
            bills = await BillsAPI.getAll();
        }

        allBills = bills;
        renderBillsTable(bills);
    } catch (error) {
        showToast('Error loading bills', 'error');
    }
}

function renderBillsTable(bills) {
    const tbody = document.getElementById('bills-table-body');
    tbody.innerHTML = bills.map(bill => {
        // Status badges
        const typeClass = bill.billType === 'INVOICE' ? 'badge-info' : 'badge-warning';
        const statusClass = bill.paymentStatus === 'PAID' ? 'badge-success' :
            bill.paymentStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger';
        return `
        <tr>
            <td>${bill.billNumber}</td>
            <td>${bill.customerName}</td>
            <td>${bill.customerMobile || '-'}</td>
            <td>${bill.eventName}</td>
            <td>${bill.palCount || 1}</td>
            <td><span class="badge ${typeClass}">${bill.billType || 'INVOICE'}</span></td>
            <td><span class="badge ${statusClass}">${bill.paymentStatus || 'DUE'}</span></td>
            <td>₹ ${Number(bill.totalAmount || 0).toLocaleString('en-IN')}</td>
            <td>₹ ${Number(bill.deposit || 0).toLocaleString('en-IN')}</td>
            <td>₹ ${Number(bill.netPayable || 0).toLocaleString('en-IN')}</td>
            <td>${formatDate(bill.billDate)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewBill(${bill.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editBill(${bill.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="printBill(${bill.id})" title="Print">
                    <i class="fas fa-print"></i>
                </button>
                ${isAdmin() ? `
                <button class="btn btn-sm btn-danger" onclick="deleteBill(${bill.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `;
    }).join('');
}

async function searchBills() {
    const query = document.getElementById('bill-search').value;
    if (query.length >= 2) {
        const results = await BillsAPI.search(query);
        renderBillsTable(results);
    } else if (query.length === 0) {
        loadBills();
    }
}

async function viewBill(id) {
    const bill = await BillsAPI.getById(id);

    const typeLabel = bill.billType === 'INVOICE' ? 'Invoice' : 'Estimate';
    const statusLabel = bill.paymentStatus === 'PAID' ? 'Paid' : bill.paymentStatus === 'PARTIAL' ? 'Partial' : 'Due';
    const statusClass = bill.paymentStatus === 'PAID' ? 'success' : bill.paymentStatus === 'PARTIAL' ? 'warning' : 'danger';

    modalTitle.textContent = 'Bill Details - ' + bill.billNumber;
    modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <span class="badge ${bill.billType === 'INVOICE' ? 'badge-info' : 'badge-warning'}">${typeLabel}</span>
                <span class="badge badge-${statusClass}">${statusLabel}</span>
            </div>
            <p><strong>Customer:</strong> ${bill.customerName} (${bill.customerMobile || ''})</p>
            <p><strong>Event:</strong> ${bill.eventName}</p>
            <p><strong>Date:</strong> ${formatDate(bill.billDate)}</p>
            <p><strong>Pals:</strong> ${bill.palCount || 1}</p>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${(bill.items || []).map(item => `
                    <tr>
                        <td>${item.itemNameGujarati}</td>
                        <td>${Number(item.quantity)}</td>
                        <td>₹ ${Number(item.rate).toLocaleString('en-IN')}</td>
                        <td>₹ ${Number(item.total).toLocaleString('en-IN')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right;">
            <p><strong>Total:</strong> ₹ ${Number(bill.totalAmount || 0).toLocaleString('en-IN')}</p>
            <p><strong>Deposit:</strong> ₹ ${Number(bill.deposit || 0).toLocaleString('en-IN')}</p>
            <p style="font-size: 18px; color: var(--success);"><strong>Net Payable:</strong> ₹ ${Number(bill.netPayable || 0).toLocaleString('en-IN')}</p>
        </div>
        <div class="btn-group">
            <button class="btn btn-secondary" onclick="editBill(${bill.id}); closeModal();">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-primary" onclick="printBill(${bill.id}); closeModal();">
                <i class="fas fa-print"></i> Print
            </button>
        </div>
    `;
    openModal();
}

// Edit Bill Function
async function editBill(id) {
    const bill = await BillsAPI.getById(id);

    modalTitle.textContent = 'Edit Bill - ' + bill.billNumber;
    modalContent.innerHTML = `
        <form id="edit-bill-form">
            <input type="hidden" id="edit-bill-id" value="${bill.id}">
            <div class="form-row">
                <div class="form-group">
                    <label>Bill Type *</label>
                    <select id="edit-bill-type" required>
                        <option value="INVOICE" ${bill.billType === 'INVOICE' ? 'selected' : ''}>Invoice</option>
                        <option value="ESTIMATE" ${bill.billType === 'ESTIMATE' ? 'selected' : ''}>Estimate</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Status *</label>
                    <select id="edit-payment-status" required>
                        <option value="DUE" ${bill.paymentStatus === 'DUE' ? 'selected' : ''}>Due</option>
                        <option value="PAID" ${bill.paymentStatus === 'PAID' ? 'selected' : ''}>Paid</option>
                        <option value="PARTIAL" ${bill.paymentStatus === 'PARTIAL' ? 'selected' : ''}>Partial</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Pals</label>
                    <input type="number" id="edit-pal-count" value="${bill.palCount || 1}" min="1">
                </div>
                <div class="form-group">
                    <label>Deposit Amount</label>
                    <input type="number" id="edit-deposit" value="${bill.deposit || 0}" step="0.01" min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Remarks</label>
                <textarea id="edit-remarks" rows="2">${bill.remarks || ''}</textarea>
            </div>
            <div style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <p><strong>Customer:</strong> ${bill.customerName}</p>
                <p><strong>Event:</strong> ${bill.eventName}</p>
                <p><strong>Total:</strong> ₹ ${Number(bill.totalAmount || 0).toLocaleString('en-IN')}</p>
                <p><strong>Net Payable:</strong> ₹ ${Number(bill.netPayable || 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;

    document.getElementById('edit-bill-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEditedBill(bill);
    });

    openModal();
}

async function saveEditedBill(originalBill) {
    const billData = {
        ...originalBill,
        billType: document.getElementById('edit-bill-type').value,
        paymentStatus: document.getElementById('edit-payment-status').value,
        palCount: parseInt(document.getElementById('edit-pal-count').value) || 1,
        deposit: parseFloat(document.getElementById('edit-deposit').value) || 0,
        remarks: document.getElementById('edit-remarks').value,
        items: originalBill.items ? originalBill.items.map(item => ({
            itemId: item.itemId,
            quantity: Number(item.quantity),
            rate: Number(item.rate)
        })) : []
    };

    try {
        await BillsAPI.update(originalBill.id, billData);
        showToast('Bill updated successfully!', 'success');
        closeModal();
        loadBills();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function printBill(id) {
    const bill = await BillsAPI.getById(id);

    // Separate left and right items
    const leftItems = bill.items ? bill.items.filter(i => {
        const inv = inventoryItems.find(inv => inv.id === i.itemId);
        return inv && inv.side === 'LEFT';
    }) : [];
    const rightItems = bill.items ? bill.items.filter(i => {
        const inv = inventoryItems.find(inv => inv.id === i.itemId);
        return inv && inv.side === 'RIGHT';
    }) : [];

    // Create rows for two-column layout
    const maxRows = Math.max(leftItems.length, rightItems.length);
    let itemRows = '';
    for (let i = 0; i < maxRows; i++) {
        const left = leftItems[i];
        const right = rightItems[i];
        itemRows += `
            <tr>
                <td>${left ? left.itemNameGujarati : ''}</td>
                <td class="center">${left ? left.quantity : ''}</td>
                <td class="right">${left ? '₹ ' + left.rate : ''}</td>
                <td class="right">${left ? '₹ ' + left.total : ''}</td>
                <td>${right ? right.itemNameGujarati : ''}</td>
                <td class="center">${right ? right.quantity : ''}</td>
                <td class="right">${right ? '₹ ' + right.rate : ''}</td>
                <td class="right">${right ? '₹ ' + right.total : ''}</td>
            </tr>
        `;
    }

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - ${bill.billNumber}</title>
            <style>
                @page { margin: 10mm; }
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 10px;
                    font-size: 11px;
                }
                .bill-container { 
                    max-width: 100%; 
                    border: 3px solid #008080;
                }
                .header {
                    text-align: center;
                    background: linear-gradient(to bottom, #E0F7FA, #B2EBF2);
                    padding: 10px;
                    border-bottom: 2px solid #008080;
                }
                .header h1 {
                    font-size: 22px;
                    color: #006064;
                    margin: 0 0 5px 0;
                    font-weight: bold;
                }
                .header p {
                    margin: 0;
                    font-size: 11px;
                    color: #333;
                }
                .bill-info {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 15px;
                    background: #E8F5E9;
                    border-bottom: 1px solid #008080;
                }
                .bill-info div {
                    font-size: 12px;
                }
                .bill-info strong {
                    color: #006064;
                }
                table.items {
                    width: 100%;
                    border-collapse: collapse;
                }
                table.items th {
                    background: #4DB6AC;
                    color: white;
                    padding: 6px 4px;
                    font-size: 10px;
                    border: 1px solid #008080;
                }
                table.items td {
                    padding: 4px;
                    border: 1px solid #B2DFDB;
                    font-size: 10px;
                }
                table.items tr:nth-child(even) {
                    background: #E0F2F1;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .totals-section {
                    display: flex;
                    justify-content: flex-end;
                    padding: 10px;
                }
                .totals-table {
                    width: 250px;
                }
                .totals-table td {
                    padding: 5px 10px;
                    border: 1px solid #4DB6AC;
                    font-size: 11px;
                }
                .totals-table tr:first-child td {
                    background: #FFF9C4;
                }
                .totals-table tr:nth-child(2) td {
                    background: #FFECB3;
                }
                .totals-table tr:last-child td {
                    background: #FFCC80;
                    font-weight: bold;
                }
                .total-label { font-weight: bold; color: #006064; }
                .signature {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px 30px;
                    margin-top: 20px;
                }
                .signature div {
                    text-align: center;
                    font-size: 11px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    width: 120px;
                    margin-top: 40px;
                }
            </style>
        </head>
        <body>
            <div class="bill-container">
                <div class="header">
                    <h1>ફાગણ સુદ ૧૩ મંડપ કોન્ટ્રાક્ટર</h1>
                    <p>(સિદસર, આદપુર, પાલીતાણા)</p>
                </div>
                <div class="bill-info">
                    <div>
                        <strong>બિલ નં:</strong> ${bill.billNumber} &nbsp;&nbsp;
                        <strong>પાલ:</strong> ${bill.palCount || 1}
                    </div>
                    <div>
                        <strong>તારીખ:</strong> ${formatDate(bill.billDate)}
                    </div>
                </div>
                <div class="bill-info">
                    <div>
                        <strong>નામ:</strong> ${bill.customerName}
                    </div>
                    <div>
                        <strong>Mobile:</strong> ${bill.customerMobile || ''}
                    </div>
                </div>
                <table class="items">
                    <thead>
                        <tr>
                            <th colspan="4" style="background: #26A69A;">ડાબી બાજુ (Left Side)</th>
                            <th colspan="4" style="background: #26A69A;">જમણી બાજુ (Right Side)</th>
                        </tr>
                        <tr>
                            <th>વિગત</th>
                            <th>નંગ</th>
                            <th>ભાવ</th>
                            <th>કુલ</th>
                            <th>વિગત</th>
                            <th>નંગ</th>
                            <th>ભાવ</th>
                            <th>કુલ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>
                <div class="totals-section">
                    <table class="totals-table">
                        <tr>
                            <td class="total-label">કુલ રકમ (Total Amount)</td>
                            <td class="right">₹ ${bill.totalAmount || 0}</td>
                        </tr>
                        <tr>
                            <td class="total-label">ડિપોઝીટ (Deposit)</td>
                            <td class="right">₹ ${bill.deposit || 0}</td>
                        </tr>
                        <tr>
                            <td class="total-label">નેટ રકમ (Net Payable)</td>
                            <td class="right">₹ ${bill.netPayable || 0}</td>
                        </tr>
                    </table>
                </div>
                <div class="signature">
                    <div>
                        <div class="signature-line"></div>
                        <p>ગ્રાહકની સહી</p>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <p>અધિકૃત સહી</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function () {
        printWindow.print();
    };
}

async function deleteBill(id) {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
        await BillsAPI.delete(id);
        showToast('Bill deleted successfully', 'success');
        loadBills();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// =============== INVENTORY ===============
async function loadInventory() {
    try {
        inventoryItems = await InventoryAPI.getAll();
        const leftItems = inventoryItems.filter(i => i.side === 'LEFT');
        const rightItems = inventoryItems.filter(i => i.side === 'RIGHT');

        document.getElementById('inventory-left-body').innerHTML = leftItems.map(item => `
            <tr>
                <td>${item.nameGujarati}</td>
                <td>${item.nameEnglish || '-'}</td>
                <td>₹ ${item.defaultRate}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('inventory-right-body').innerHTML = rightItems.map(item => `
            <tr>
                <td>${item.nameGujarati}</td>
                <td>${item.nameEnglish || '-'}</td>
                <td>₹ ${item.defaultRate}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading inventory', 'error');
    }
}

function editInventoryItem(id) {
    const item = inventoryItems.find(i => i.id === id);

    modalTitle.textContent = 'Edit Item Rate';
    modalContent.innerHTML = `
        <form id="inventory-form">
            <input type="hidden" id="inv-id" value="${item.id}">
            <div class="form-group">
                <label>Item (Gujarati)</label>
                <input type="text" value="${item.nameGujarati}" disabled>
            </div>
            <div class="form-group">
                <label>Item (English)</label>
                <input type="text" id="inv-english" value="${item.nameEnglish || ''}">
            </div>
            <div class="form-group">
                <label>Default Rate (₹)</label>
                <input type="number" id="inv-rate" value="${item.defaultRate}" step="0.01" required>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    document.getElementById('inventory-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await InventoryAPI.update(item.id, {
                nameEnglish: document.getElementById('inv-english').value,
                defaultRate: parseFloat(document.getElementById('inv-rate').value)
            });
            showToast('Item updated successfully', 'success');
            closeModal();
            loadInventory();
            loadInitialData();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    openModal();
}

// =============== USERS ===============
async function loadUsers() {
    try {
        const users = await UsersAPI.getAll();
        const tbody = document.getElementById('users-table-body');

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td>${user.email || '-'}</td>
                <td>${user.roleIds?.map(rid => allRoles.find(r => r.id === rid)?.name || '').join(', ') || '-'}</td>
                <td>
                    <span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">
                        ${user.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading users', 'error');
    }
}

function showUserModal(user = null) {
    modalTitle.textContent = user ? 'Edit User' : 'Add User';
    modalContent.innerHTML = `
        <form id="user-form">
            <input type="hidden" id="user-id" value="${user?.id || ''}">
            <div class="form-row">
                <div class="form-group">
                    <label>Username *</label>
                    <input type="text" id="user-username" value="${user?.username || ''}" ${user ? 'disabled' : 'required'}>
                </div>
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="user-fullname" value="${user?.fullName || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="user-email" value="${user?.email || ''}">
                </div>
                <div class="form-group">
                    <label>${user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input type="password" id="user-password" ${user ? '' : 'required'}>
                </div>
            </div>
            <div class="form-group">
                <label>Roles *</label>
                <div id="user-roles" style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${allRoles.map(role => `
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" name="roles" value="${role.id}" ${user?.roleIds?.includes(role.id) ? 'checked' : ''}>
                            ${role.name}
                        </label>
                    `).join('')}
                </div>
            </div>
            ${user ? `
            <div class="form-group">
                <label>
                    <input type="checkbox" id="user-active" ${user.active ? 'checked' : ''}>
                    Active
                </label>
            </div>
            ` : ''}
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    document.getElementById('user-form').addEventListener('submit', saveUser);
    openModal();
}

async function editUser(id) {
    const user = await UsersAPI.getById(id);
    showUserModal(user);
}

async function saveUser(e) {
    e.preventDefault();

    const id = document.getElementById('user-id').value;
    const roleIds = Array.from(document.querySelectorAll('input[name="roles"]:checked'))
        .map(cb => parseInt(cb.value));

    const data = {
        username: document.getElementById('user-username').value,
        fullName: document.getElementById('user-fullname').value,
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value || undefined,
        roleIds: roleIds,
        active: id ? document.getElementById('user-active')?.checked : true
    };

    try {
        if (id) {
            if (!data.password) delete data.password;
            await UsersAPI.update(id, data);
            showToast('User updated successfully', 'success');
        } else {
            await UsersAPI.create(data);
            showToast('User created successfully', 'success');
        }
        closeModal();
        loadUsers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// =============== ROLES ===============
async function loadRoles() {
    try {
        allRoles = await RolesAPI.getAll();
        allPermissions = await RolesAPI.getPermissions();

        const tbody = document.getElementById('roles-table-body');
        tbody.innerHTML = allRoles.map(role => `
            <tr>
                <td>${role.name}</td>
                <td>${role.description || '-'}</td>
                <td>${role.permissionIds?.length || 0} permissions</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editRole(${role.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading roles', 'error');
    }
}

function showRoleModal(role = null) {
    modalTitle.textContent = role ? 'Edit Role' : 'Add Role';
    modalContent.innerHTML = `
        <form id="role-form">
            <input type="hidden" id="role-id" value="${role?.id || ''}">
            <div class="form-group">
                <label>Role Name *</label>
                <input type="text" id="role-name" value="${role?.name || ''}" ${role ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="role-description" value="${role?.description || ''}">
            </div>
            <div class="form-group">
                <label>Permissions</label>
                <div id="role-permissions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${allPermissions.map(perm => `
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" name="permissions" value="${perm.id}" ${role?.permissionIds?.includes(perm.id) ? 'checked' : ''}>
                            ${perm.name}
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    document.getElementById('role-form').addEventListener('submit', saveRole);
    openModal();
}

async function editRole(id) {
    const role = await RolesAPI.getById(id);
    showRoleModal(role);
}

async function saveRole(e) {
    e.preventDefault();

    const id = document.getElementById('role-id').value;
    const permissionIds = Array.from(document.querySelectorAll('input[name="permissions"]:checked'))
        .map(cb => parseInt(cb.value));

    const data = {
        name: document.getElementById('role-name').value,
        description: document.getElementById('role-description').value,
        permissionIds: permissionIds
    };

    try {
        if (id) {
            await RolesAPI.update(id, data);
            showToast('Role updated successfully', 'success');
        } else {
            await RolesAPI.create(data);
            showToast('Role created successfully', 'success');
        }
        closeModal();
        loadRoles();
        loadInitialData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// =============== MODAL HELPERS ===============
function openModal() {
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// =============== UTILS ===============
function formatCurrency(amount) {
    return '₹ ' + (amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal on overlay click
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});
