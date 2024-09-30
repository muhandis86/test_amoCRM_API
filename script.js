const subdomain = 'eskendarov';
const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ijk4MDE0NDhlMjRhYTFhODY3OTQxMDgyZjJjMDIyOTM4NTU5ZTU3NTAwZTg4YzkzYjUyZjA2MGJmNWUzZGU4MjJlZjRlZGM5NmJlZmEzZGY2In0.eyJhdWQiOiIxYWE0ZGQ3My1lY2Y1LTQxOTEtODhiMC1iMTU0ZDcxMmY3MGEiLCJqdGkiOiI5ODAxNDQ4ZTI0YWExYTg2Nzk0MTA4MmYyYzAyMjkzODU1OWU1NzUwMGU4OGM5M2I1MmYwNjBiZjVlM2RlODIyZWY0ZWRjOTZiZWZhM2RmNiIsImlhdCI6MTcyNzYzMTQ4NSwibmJmIjoxNzI3NjMxNDg1LCJleHAiOjE3MzAzMzI4MDAsInN1YiI6IjExNTM4NDM0IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTU4ODUwLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMTZkMjc5NDUtZTQ1Ni00NjI0LWIwNzItY2JhZmYyMWZmM2FhIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.rnHlnrTNDlVfZQmh14vvluo3-QiiyEN0Fo7SFLfZuyCoIL3FpSek1VQKzWNBwE90RjxMBLy6F5ZcVyn9ynWefuYkSv22dGwSfD7xLmtoKtjLD2XEtsuZ1RitEfwtNb53_gzQIAplisXGTFIATmYifXRFIwZIuWb90q9QhzO_4TdTVJzahGlYN_K4gk7Wh_9Tdn4IeJSuIzSZkDcxFvOAcTW8bzownHQgVlPO5RSs2v-ImnrqJNv9AUTkqj0MFIbwFrNVCSD6DZb73igjQdwgZePWON4slJ1ZFhUbO2QAnT92PlCV5hq8VLJp5MdKFEH8717taaa_gL5qjBVR_5pKEA';

const tableBody = document.querySelector('#deals-table tbody');
let page = 1;
const limit = 3;
let isNextPage = true;
let response = null;
let lastOpenedDeal = null;

// ============================= Функция получения сделок ============================
const fetchDeals = async (page, limit) => {
    try {
        if (isNextPage) {
            response = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads?limit=${limit}&page=${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            return [];
        }

        const data = await response.json();

        if (!data._links.next) {
            isNextPage = false;
        }

        return data._embedded.leads;

    } catch (error) {
        console.error('Ошибка при получении сделок:', error);
        return [];
    }
};

// ============================= Функция получения деталей сделки ============================
const fetchDealDetails = async (dealId) => {
    try {
        const response = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads/${dealId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при получении деталей сделки:', error);
        return null;
    }
};

// ============================= Функция отрисовки сделок ============================
const renderDeals = (deals) => {
    deals.forEach(deal => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', deal.id); // Сохраняем ID сделки в атрибуте
        row.innerHTML = renderCard(deal, false);

        // Добавляем обработку клика по строке
        row.addEventListener('click', () => handleDealClick(deal, row));
        tableBody.appendChild(row);
    });
};

// // ============================= Функция отрисовки карточки сделки ============================
const renderCard = (deal, isOpened) => {
    if (isOpened) {
        return `
            <td colspan="3">
                <div class="deal-card">
                    <h2>${deal.name}</h2>
                    <div class="deal-details">
                        <div><b>id:</b> ${deal.id}</div>
                        <div><b>date:</b> ${formatDate(deal.created_at * 1000)}</div>
                        <div class="deal-status"><b>status:</b> 
                            <svg viewBox="0 0 20 20" width="20" height="20">
                                <circle cx="10" cy="10" r="10" fill="${getTaskStatus(deal.closest_task_at)}" />
                            </svg>
                        </div>
                    </div>
                </div>
            </td>
        `;
    } else {
        return `
            <td>${deal.id}</td>
            <td>${deal.name}</td>
            <td>${deal.price}</td>
        `;
    }
}

// ============================= Функция обработки клика по сделке ============================
const handleDealClick = async (deal, rowElement) => {

    if (rowElement.classList.contains('opened')) {
        rowElement.classList.remove('opened');
        rowElement.innerHTML = renderCard(deal, false);
    } else {
        rowElement.classList.add('opened');
        rowElement.innerHTML = `<td colspan="3"><div class="spinner"></div></td>`; // Отображаем спиннер      

        if (lastOpenedDeal && lastOpenedDeal.id !== deal.id) {
            const lastOpenedRow = document.querySelector(`tr[data-id="${lastOpenedDeal.id}"]`);
            lastOpenedRow.classList.remove('opened');
            lastOpenedRow.innerHTML = renderCard(lastOpenedDeal, false);
        }

        const dealDetails = await fetchDealDetails(deal.id); // Получаем детальные данные по сделке
        lastOpenedDeal = deal;

        if (dealDetails) {
            rowElement.innerHTML = renderCard(dealDetails, true);
        }
    }
};

// ============================= Функция для получения статуса задачи ============================
const getTaskStatus = (closestTaskAt) => {
    if (!closestTaskAt) {
        return 'red'; // Нет задачи
    }

    const taskDate = new Date(closestTaskAt * 1000);
    const currentDate = new Date();

    if (taskDate < currentDate.setHours(0, 0, 0, 0)) {
        return 'red'; // Задача просрочена
    } else if (taskDate.toDateString() === currentDate.toDateString()) {
        return 'green'; // Задача на сегодня
    } else {
        return 'yellow'; // Задача позже
    }
};
// ============================= Функция для форматирования даты ============================
const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU');
};

// ================== Функция поэтапного запроса сделок каждые 1 секунду =================
const loadDealsInBatches = () => {

    const intervalId = setInterval(async () => {
        const deals = await fetchDeals(page, limit); // Запрашиваем сделки с текущей страницы

        if (deals.length > 0) {
            renderDeals(deals); // Отображаем сделки
            page++; // Увеличиваем номер страницы для следующего запроса
        } else {
            clearInterval(intervalId); // Останавливаем запросы, когда сделки заканчиваются
            console.log('Все сделки загружены');
        }
    }, 1000);
};

// =========================== Запускаем процесс загрузки сделок ========================
loadDealsInBatches();
