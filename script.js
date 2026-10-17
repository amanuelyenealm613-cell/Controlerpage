const firebaseConfig = {
    apiKey: "AIzaSyCm6vPlapGOIn95I3NER6t1g3FHR1xKI3g",
    authDomain: "adane-hotel.firebaseapp.com",
    databaseURL: "https://adane-hotel-default-rtdb.firebaseio.com",
    projectId: "adane-hotel"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const ALLOWED_ADMIN_EMAIL = "amanuelyenealm613@gmail.com"; 
let generatedOtp = "";
let userEmailAttempt = "";

function requestOTP(e) {
    e.preventDefault();
    userEmailAttempt = document.getElementById('adminEmailInput').value.trim();

    if (userEmailAttempt !== ALLOWED_ADMIN_EMAIL) {
        const alertParams = { 
            to_email: ALLOWED_ADMIN_EMAIL, 
            suspicious_email: userEmailAttempt,
            time_attempt: new Date().toLocaleString()
        };

        emailjs.send('service_6akt2ad', 'template_8vnsgpc', alertParams)
            .then(() => {
                console.log("⚠️ Security alert email sent!");
            }).catch(err => {
                console.error("EmailJS Error:", err);
            });

        alert("❌ Warning! Unauthorized access attempt detected. The administrator (Aman) has been notified via email.");
        return;
    }

    generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const templateParams = { to_email: userEmailAttempt, otp_code: generatedOtp };

    emailjs.send('service_6akt2ad', 'template_8vnsgpc', templateParams)
        .then(function(response) {
            alert(`✅ OTP code has been sent to your email (${userEmailAttempt})!`);
            document.getElementById('loginContainer').classList.add('hidden');
            document.getElementById('otpContainer').classList.remove('hidden');
            document.getElementById('otpInfoText').innerText = `An OTP code has been sent to ${userEmailAttempt}. Please check your email inbox!`;
        }, function(error) {
            alert("❌ Failed to send email: " + JSON.stringify(error));
        });
}

function verifyOTP(e) {
    e.preventDefault();
    const entered = document.getElementById('enteredOtp').value.trim();

    if (entered === generatedOtp) {
        alert("✅ Verification successful! Entering admin dashboard...");
        document.getElementById('otpContainer').classList.add('hidden');
        document.getElementById('dashboardContainer').classList.remove('hidden');
        loadControllerData();
    } else {
        alert("❌ Incorrect OTP code! Please try again.");
    }
}

function logoutController() {
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('adminEmailInput').value = '';
    document.getElementById('enteredOtp').value = '';
}

function loadControllerData() {
    database.ref('hotels').on('value', (snapshot) => {
        let hotelsTable = document.getElementById('hotelsTableBody');
        hotelsTable.innerHTML = '';
        let count = 0;
        snapshot.forEach((child) => {
            let h = child.val();
            if (h && h.name && h.location) {
                count++;
                let hotelId = h.hotelId || child.key;
                hotelsTable.innerHTML += `
                    <tr>
                        <td style="color:var(--primary-gold); font-weight:bold;">${hotelId}</td>
                        <td>${h.name}</td>
                        <td>${h.location}</td>
                        <td>
                            <a href="${h.licenseImg || '#'}" target="_blank" style="color:#38bdf8; margin-right:5px;">License</a> | 
                            <a href="${h.renewalImg || '#'}" target="_blank" style="color:#38bdf8; margin-left:5px;">Renewal</a>
                        </td>
                        <td><button class="action-btn" onclick="deleteHotel('${child.key}')">Delete</button></td>
                    </tr>
                `;
            }
        });
        document.getElementById('totalHotels').innerText = count;
    });

    database.ref('orders').on('value', (snapshot) => {
        let ordersTable = document.getElementById('ordersTableBody');
        ordersTable.innerHTML = '';
        let orderCount = 0;
        let revenue = 0;

        snapshot.forEach((child) => {
            orderCount++;
            let o = child.val();
            revenue += Number(o.price || 0);
            ordersTable.innerHTML += `
                <tr>
                    <td>${o.id || '-'}</td>
                    <td>${o.service || '-'}</td>
                    <td>${o.customer || '-'}</td>
                    <td style="color:var(--primary-gold); font-weight:bold;">${o.price || 0} ETB</td>
                    <td>
                        <a href="${o.faydaImg || '#'}" target="_blank" style="color:#38bdf8; margin-right:5px;">Fayda ID</a> | 
                        <a href="${o.receiptImg || '#'}" target="_blank" style="color:#38bdf8; margin-left:5px;">Receipt</a>
                    </td>
                    <td>${o.status || 'pending'}</td>
                    <td><button class="action-btn" onclick="deleteSingleOrder('${child.key}')">Remove</button></td>
                </tr>
            `;
        });
        document.getElementById('totalOrders').innerText = orderCount;
        document.getElementById('totalRevenue').innerText = revenue + " ETB";
    });

    database.ref('users').on('value', (snapshot) => {
        document.getElementById('totalUsers').innerText = snapshot.numChildren() || 0;
    });
}

function deleteSingleOrder(orderKey) {
    if(confirm("Are you sure you want to delete this customer order and its files?")) {
        database.ref('orders/' + orderKey).remove().then(() => {
            alert("✅ Order and files successfully deleted!");
        });
    }
}

function clearAllDataAndRevenue() {
    if(confirm("⚠️ Warning! Do you want to completely clear all customer orders, files, and total revenue? This action cannot be undone!")) {
        database.ref('orders').remove().then(() => {
            alert("✅ All customer files, orders, and revenue have been successfully reset!");
        }).catch(error => {
            alert("❌ Error: " + error.message);
        });
    }
}

function addNewHotel(e) {
    e.preventDefault();
    let name = document.getElementById('hotelName').value.trim();
    let location = document.getElementById('hotelLocation').value.trim();
    let hotelImgFile = document.getElementById('hotelImg').files[0];
    let licenseFile = document.getElementById('licenseImg').files[0];
    let renewalFile = document.getElementById('renewalImg').files[0];

    if(!hotelImgFile || !licenseFile || !renewalFile) { 
        alert("Please select all required photos (Hotel photo, Business license, and Renewal proof)!"); 
        return; 
    }

    let uniqueHotelId = 'HOTEL-' + Math.floor(100000 + Math.random() * 900000);

    let readerHotel = new FileReader();
    readerHotel.readAsDataURL(hotelImgFile);
    readerHotel.onload = function(evt1) {
        let imgUrl = evt1.target.result;

        let readerLicense = new FileReader();
        readerLicense.readAsDataURL(licenseFile);
        readerLicense.onload = function(evt2) {
            let licenseUrl = evt2.target.result;

            let readerRenewal = new FileReader();
            readerRenewal.readAsDataURL(renewalFile);
            readerRenewal.onload = function(evt3) {
                let renewalUrl = evt3.target.result;

                database.ref('hotels').push({
                    hotelId: uniqueHotelId,
                    name: name,
                    location: location,
                    img: imgUrl,
                    licenseImg: licenseUrl,
                    renewalImg: renewalUrl
                })
                .then(() => {
                    alert(`✅ Hotel registered successfully!\nUnique Hotel ID: ${uniqueHotelId}`);
                    document.getElementById('addHotelForm').reset();
                })
                .catch((error) => {
                    alert("❌ Error: " + error.message);
                });
            };
        };
    };
}

function deleteHotel(id) {
    if(confirm("Are you sure you want to delete this hotel?")) {
        database.ref('hotels/' + id).remove();
    }
}
