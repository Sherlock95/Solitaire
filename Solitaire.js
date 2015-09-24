var canvas;
var gl;

var vPosition;
var vColor;

// Empty array/matrix that will hold all the cards in the game.
var cards = new Array( 52 );

// Holds the array position for cards that need to be updated 
// on call to render();
// Starts with all cards in the cards array.
var cardsToUpdate = new Array( 52 );
var positionsX = new Array( 52 * 4 );
var positionsY = new Array( 52 * 4 );

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.165, 0.714, 0.043, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cards), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    initCards();

    render();
};

function initCards()
{
    cards[ 0 ] = {
        name: "acespades",
        positionsX: [0, 1, 2, 3],
        positionsY: [0, 1, 2, 3],
        color: vec4( 1.0, 0.0, 0.0, 1.0 );
    };

    cardsToUpdate[ 0 ] = 0;
}


function render() 
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    for ( var i = 0; i < cardsToUpdate.length; i++ )
    {
        //update cards to update
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertices.length );
    }
}
