// --- 2. GESTION DU THÈME ---
const themeBtn = document.getElementById('themeBtn');
const icon = themeBtn.querySelector('i');
const html = document.documentElement;

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
}

function setTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

themeBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-bs-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

initTheme();

// --- 3. MAIL & ACTIONS ---
function handleFormSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('userName').value || "Futur Adhérent";
    const age = document.getElementById('userAge').value || "Non précisé";
    const contactInfo = document.getElementById('userContact').value;
    const subjectType = document.getElementById('userSubject').value;
    const loc = document.getElementById('userLoc').value || "Non précisé";
    
    // Replace YOUR_FORMSPREE_ID with your actual Formspree form ID
    const formspreeEndpoint = "https://formspree.io/f/xdabjpqa";

    const formData = new FormData();
    
    // Si le contact ressemble à un email, on le passe dans le champ spécial "email" pour que Formspree permette de "Répondre à"
    if (contactInfo.includes('@')) {
        formData.append("email", contactInfo);
    } else {
        formData.append("Téléphone renseigné", contactInfo);
    }

    // Création d'un message récapitulatif propre et lisible pour le professeur
    let cleanMessage = `Nouvelle demande depuis le site web !\n\n`;
    cleanMessage += `👤 Profil de l'adhérent :\n`;
    cleanMessage += `- Nom : ${name}\n`;
    cleanMessage += `- Âge : ${age} ans\n`;
    cleanMessage += `- Moyen de contact : ${contactInfo}\n\n`;
    cleanMessage += `🎯 Détails de la demande :\n`;
    cleanMessage += `- Type de demande : ${subjectType}\n`;
    cleanMessage += `- Lieu / Date souhaitée : ${loc}\n`;

    // Formspree affichera "message" comme corps principal de l'email
    formData.append("message", cleanMessage);
    formData.append("Sujet du mail", `[SITE] ${subjectType} - ${name}`);

    const btn = event.target.querySelector('.btn-primary') || document.querySelector('#contactForm .btn-primary');
    const originalText = btn.innerText;
    btn.innerText = "Envoi...";
    btn.disabled = true;

    fetch(formspreeEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            const toastEl = document.getElementById('copyToast');
            if (toastEl) {
                const lang = localStorage.getItem('lang') || 'fr';
                const successMsg = (window.translations && window.translations[lang]) ? window.translations[lang]['toast_success'] : "Message envoyé avec succès !";
                toastEl.querySelector('.fw-bold').innerText = successMsg;
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
            document.getElementById('contactForm').reset();
            const modalElement = document.getElementById('contactModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();
            }
        } else {
            alert("Erreur lors de l'envoi du message.");
        }
    }).catch(error => {
        alert("Erreur réseau. Impossible d'envoyer le message.");
    }).finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
}

function justCopyEmail() {
    const email = "muzenza.capoeira.saintouen@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const toastEl = document.getElementById('copyToast');
        if (toastEl) {
            const lang = localStorage.getItem('lang') || 'fr';
            const copyMsg = (window.translations && window.translations[lang]) ? window.translations[lang]['toast_copy'] : "Email copié !";
            toastEl.querySelector('.fw-bold').innerText = copyMsg;
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
        
        const modalElement = document.getElementById('contactModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
        }
    });
}

// Make functions globally available
window.justCopyEmail = justCopyEmail;

// --- 5. PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// --- 4. ANIMATIONS & DATE ---
document.addEventListener('DOMContentLoaded', () => {
    const date = new Date();
    const day = date.getDay(); 
    const items = document.querySelectorAll('.schedule-item');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    let isOpenToday = false;

    items.forEach(item => {
        const classDay = parseInt(item.getAttribute('data-day'));
        if (day === classDay) {
            item.classList.add('active');
            // Check if user has scrolled before auto-scrolling
            if (window.scrollY === 0 && window.innerWidth > 991) {
                // On mobile, scrolling to schedule immediately might hide the hero.
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            isOpenToday = true;
        }
    });

    if (isOpenToday && statusDot && statusText) {
        statusDot.classList.add('status-open');
        statusText.innerText = "COURS CE SOIR";
        statusText.style.color = "#2ecc71";
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        setTimeout(() => observer.observe(card), index * 100);
    });

    // Back to top button logic
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
