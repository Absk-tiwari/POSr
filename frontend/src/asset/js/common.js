const currency = localStorage.getItem('currency');

function showAlert (msg, error = false, hideAfter=3000) {
    $.toast({
        heading: error ? 'Error':'Success',
        text: msg,
        showHideTransition: 'fade',
        icon: error? 'error':'success',
        hideAfter
    })
}
function capitalFirst(string) {
    if (!string) return string; // Handle empty or null strings
    if(string.includes(' ')){
        let str= '';
        string.split(' ').forEach( part => {
           str+=' '+ part.charAt(0).toUpperCase() + part.slice(1);
        })
        return str;
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function validate(fields,exceptions=[]){
    let result={}
    var shouldGo=true;
    if(exceptions.length) {
        exceptions.forEach( item => {
            delete fields[item]
        })
    }
    fields.forEach(f => {
        let shout = '';
        let invalid = false;
        let tInputs = [$(`input[name=${f}]`), $(`select[name=${f}]`), $(`textarea[name=${f}]`), $(`.${f}`)]
        tInputs.forEach( input => {

            if($(input).val()?.length == 0)
            {
                invalid = true;
                result[f]=`Required!`;
                shouldGo=false;
            }
            if(invalid){
                shouldGo = false;
                $(input).addClass('placeholder-error').attr('placeholder',result[f])//.css('border','1px solid red');
            } else {
                $(input).removeClass('placeholder-error').attr('placeholder',result[f])//.css('border','');
            }
        })
    })
    return {result, shouldGo};
}


const wrapText = (text, maxLength) => {

    if (text?.length > maxLength) {
        let truncatedText = text.substring(0, maxLength) + '...';
        return truncatedText;
    }
    return text
}

function chunk(array, size, uncategorized = false) {
    const result = [];
    if(!array) return []
    if(uncategorized && !done) array.unshift({})
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }

    return result;
}


function printDiv(divId, styles='') {

    var printContents = document.getElementById(divId).innerHTML;
    var iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';  // Hidden
    document.body.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>Print</title><style>${styles}</style></head><body>`);
    doc.write(printContents);
    doc.write('</body></html>');
    doc.close();

    setTimeout(()=>{
        iframe.contentWindow.focus();
        iframe.contentWindow.print()
        document.body.removeChild(iframe);  // Clean up
    }, 2000)

}

function hexToRgb(hex) {
    if(!hex || typeof hex == 'object'){
        return hex
    }
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(h => h + h).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}

function isColorDark(hexColor) {
    let output = hexToRgb(hexColor)
    if(output === undefined) return hexColor
    const { r, g, b } = output
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 128;
}


const howLong = date => {

	let today = new Date()
	let diffTime = Math.abs(today - new Date(date)); // returns the diff in milliseconds
	let seconds = diffTime / 1000
	seconds = parseInt(seconds)
	let outputDiff
	if(seconds < 3600 && seconds > 60){
		let totalmins = seconds / 60
		outputDiff = Math.round(totalmins)+'m ago'
	}else if(seconds >= 3600 && seconds < 86400){
		let totalhrs = seconds / 3600
		outputDiff = Math.round(totalhrs)+'h ago'
	}else if(seconds >= 3600 * 24 && seconds < 3600 * 24 * 7){
		let totaldays = seconds / 86400
		outputDiff = Math.round(totaldays)+'d ago'
	}else if(seconds >= 3600 * 24 * 7 ){
		let totalweeks = seconds / 604800
		outputDiff = Math.round(totalweeks)+'w ago'
	}else if(seconds >= 365*24*60*60 ){
		let totalyrs = seconds / 604800
		outputDiff = Math.round(totalyrs)+'y ago'
	}else if(seconds < 60 && seconds > 10){
		outputDiff = Math.round(seconds)+'s ago'
	}else if(seconds < 10){
		outputDiff = ' just now'
	}
	return outputDiff
}

const randomStr = length => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
	const randomIndex = Math.floor(Math.random() * characters.length);
	    result += characters.charAt(randomIndex);
	}
	return result;
}

const date = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0'); // Get day and pad with leading zero if needed
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed, so add 1) and pad with leading zero
    const year = today.getFullYear(); // Get full year
    return `${day}-${month}-${year}`;
}
