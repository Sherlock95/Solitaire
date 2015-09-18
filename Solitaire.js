var canvas;
var gl;

var vPosition;
var vColor;

// Empyt array/matrix that will hold all the cards in the game.
var cards = [];
var positions1 = [
    vec4( -0.5, 0.5 )
];
var positions2 = [
    vec4( 0.5, 0.5 )
];
var positions3 = [
    vec4( -0.5, -0.5 )
];
var positions4 = [
    vec4( 0.5, -0.5 )
];

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
    var cardTexture = gl.createTexture();
    cardImage = new Image();
    cardImage.onLoad = function() { handleTextureLoading( cardImage, cardTexture ); };
    cardImage.src = "img/acespades.png";
    cards[ 0 ] = {
        card: 1,
        texture: cardTexture,
        image: cardImage,
        color: 0,
        vertices: vec4( positions1[0], positions2[0], positions3[0], positions4[0] )
    };
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, cards.length );
}
