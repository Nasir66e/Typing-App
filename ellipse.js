var canvas = document.getElementById("timer");
var ctx = canvas.getContext("2d");

// Initial canvas size
canvas.width = 126;
canvas.height = 76;
var canvasWidth;
var canvasHeight;
var radiusX;
var radiusY;

var durationSelected = parseInt(localStorage.getItem('durationSelected'));

var startAngle = -Math.PI / 2;  // Start from the top (12 o'clock position)
var sliceAngle = 2 * Math.PI / durationSelected;  // Each slice is 1/120th of the full circle
var endAngle = startAngle;
var interval = 1000; // 1 second
var totalSlices = 0;
var slicesDrawn = 0;
var timerAnimation;

    // Function to start the timer and draw slices
    function startTimer() {
        totalSlices = durationSelected;  // Get total slices based on selection
        endAngle = startAngle;  // Reset the endAngle
        slicesDrawn = 0;  // Reset slices drawn count

        if (totalSlices === 0) {
            // If "Free" is selected, do not draw any slices
            //alert('Free selected, no slices to draw!');
            return;
        }

        timerAnimation = setInterval(function() {
            endAngle += sliceAngle;  // Increment the end angle by the slice amount
            drawPie();
            slicesDrawn++;
            if (slicesDrawn >= totalSlices) {  // Stop after the selected number of slices
                clearInterval(timerAnimation);
                //alert('Time is up!');
            }
        }, interval);
    }

    // Function to draw pie slices
    function drawPie() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Drawing the full oval with white color
        ctx.beginPath();
        ctx.ellipse(canvasWidth / 2, canvasHeight / 2, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();

        // Drawing the pie slice with light green color
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, canvasHeight / 2);  // Move to the center of the oval
        ctx.ellipse(canvasWidth / 2, canvasHeight / 2, radiusX, radiusY, 0, startAngle, endAngle);
        ctx.lineTo(canvasWidth / 2, canvasHeight / 2);  // Line back to the center
        ctx.fillStyle = "rgb(151 193 90)";
        ctx.fill();
    }

// Adjust canvas size and draw oval based on canvas size
function adjustCanvas() {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    // Dynamic radius based on canvas size
    radiusX = canvasWidth / 2;  // 100% of the canvas width
    radiusY = canvasHeight / 2; // 100% of the canvas height



    // Initial draw
    drawPie();

}

// Adjust the canvas on window resize
// window.addEventListener('resize', function() {
//     adjustCanvas();  // Adjust the oval and redraw when the window size changes
// });

// Initial call to adjust canvas and draw
adjustCanvas();
