const testing = 'http://localhost:5000'
const production = 'https://www.ticketdecisionassistant.com'
globalThis.environment = production

window.addEventListener('DOMContentLoaded', async (e) => {

    chrome.storage.local.set({'test': 'hi'}, function () {})
    chrome.storage.local.set({'best': 'bye'}, function () {})

   await chrome.storage.local.get(['test', 'best'], async function (result) {
        console.log(result)
    })


    const Toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        iconColor: 'white',
        customClass: {
            popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 2300
    })

    document.querySelector('#confirm-code').addEventListener('click', async () => {

        chrome.storage.local.get(['registration', 'registration_code'], async function (alreadyRegisteredCheckRaw) {

            const alreadyRegisteredCheck = alreadyRegisteredCheckRaw['registration_code']
            if (alreadyRegisteredCheck) {
                await Toast.fire({ icon: 'error', title: 'You have already registered an access code from this extension.' })
                return
            }
    
            let activation_code = document.querySelector('#activation_code').value
    
            try {
                const authorization_status = await fetch(`${globalThis.environment}/api/activate_purchaser_account`, {
                    "method": "POST",
                    "body": JSON.stringify({
                        'activation_code': activation_code.toString()
                    }),
                    cache: "no-cache",
                    headers: new Headers({
                        "content-type": "application/json"
                    })
                }).then((response) => response.json())
                .then((data) => {
                    return data
                })
                .catch(err => {
                    console.error(err)
                    return {'response': 'Unkown error occured. Please contact an admin.'}
                })
    
                console.log(authorization_status)
    
                if (authorization_status['response'] == "Success") {
                    await chrome.storage.local.set({
                        'registration' : authorization_status['registration_code'],
                        'username': authorization_status['username'],
                        'activation_status': authorization_status['activation_status'],
                        'activation_code': activation_code
                    }, function () {})
                    document.querySelector('#username').textContent =  authorization_status['username']
                    document.querySelector('#activation_status').textContent = authorization_status['activation_status'] == "True" ? "Active" : "Inactive"
                    document.querySelector('#pre').style.display = 'none'
                    document.querySelector('#post').style.display = 'block'
    
                    await Toast.fire({ icon: 'success', title: 'Your account has been set up!' })
    
                    return
                }
                
                await Toast.fire({ icon: 'error', title: authorization_status['response'] })
            }
            catch (err) {
                console.error(err)
                await Toast.fire({ icon: 'error', title: 'Unknown error occured. Please try again or contact an admin.' })
                return 'Unkown error occured. Please contact an admin.'
            }    
            
        })

    })
        
    await chrome.storage.local.get(['activation_code'], async function (user_token_raw) {
        let user_token = user_token_raw['activation_code']

        if (user_token) {
            const authorization_status = await fetch(`${globalThis.environment}/api/check_user_status`, {
                "method": "POST",
                "body": JSON.stringify({
                    'activation_code': user_token.toString()
                }),
                cache: "no-cache",
                headers: new Headers({
                    "content-type": "application/json"
                })
            }).then((response) => response.json())
            .then((data) => {
                return data
            })
    
            console.log(authorization_status)
        
            if (authorization_status.response == 'deactivated') {
                chrome.storage.local.set({
                    'deactivated': true,
                    'reason': authorization_status.reason // "Security" vs "Deleted By User"
                }, function () {})
            } else {
                chrome.storage.local.set({
                    'deactivated': false,
                    'reason': null,
                    'activation_status': authorization_status.activation_status
                }, function () {})
            }
        } else {
            document.querySelector('#loader').style.display = 'none'
            document.querySelector('#pre').style.display = 'block'
            return
        }
    
    })
   
    await chrome.storage.local.get(['deactivated', 'reason', 'username', 'activation_status'], async function (data) {

        let deactivated = data['deactivated']
        let reason = data['reason']

        if (deactivated) {
            document.querySelector('#loader').style.display = 'none'
            document.querySelector('#pre').style.display = 'none'
            document.querySelector('#post').style.display = 'block'
            document.querySelector('#account_active').style.display = 'none'
            if (reason == 'Security') {
                document.querySelector('#account_inactive_security').style.display = 'block'
            } else {
                document.querySelector('#account_removed').style.display = 'block'
            }
            console.log('ssddsdss')
            return
        }

        console.log('hitting here')

        let user_name = data['username']
        let activation_status = data['activation_status']

        console.log('hwere')
        if (user_name) {
            document.querySelector('#loader').style.display = 'none'
            document.querySelector('#username').textContent = user_name
            document.querySelector('#activation_status').textContent = activation_status == "True" ? "Active" : "Inactive"
            document.querySelector('#pre').style.display = 'none'
            document.querySelector('#post').style.display = 'block'
        } else {
            document.querySelector('#loader').style.display = 'none'
            document.querySelector('#pre').style.display = 'block'
        }
    })

})