var canvas;
var gl;

var vPosition;
var vColor;
var imageLoc;

// Arrays to hold names for card generation
var cardNum = [ "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king" ];
var cardType = [ "spades", "hearts", "clubs", "diamonds" ];

// Empty array/matrix that will hold all the cards in the game.
var cards = [];

// Holds the array position for cards that need to be updated 
// on call to render();
// Starts with all cards in the cards array.
var cardsToUpdate = [];
var cardOriginX = new Array( 52 );
var cardOriginY = new Array( 52 );
var cardImages = [];
var clickableCards = [];
var CARD_WIDTH = 75;
var CARD_HEIGHT = 105;

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

    // Associate out shader variables with our data buffer
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    imageLoc = gl.getUniformLocation( program, "image" );
    gl.uniform1i( imageLoc, 0 );

    var resolutionLocation = gl.getUniformLocation( program, "uResolution" );
    gl.uniform2f( resolutionLocation, canvas.width, canvas.height );

    initCards();

    render();
};

function initCards()
{
    cards[ 0 ] = {
        name: "acespades",
        id: 0
    };

    cardOriginX[ cards[ 0 ].id ] = ( canvas.width / 2 ) - ( CARD_WIDTH / 2 );
    cardOriginY[ cards[ 0 ].id ] = ( canvas.height / 2 ) - ( CARD_HEIGHT / 2 ); 
    
    cardsToUpdate.push( 0 );
    clickableCards.push( 0 );
}

function render() 
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    for ( var i = 0; i < cardsToUpdate.length; i++ )
    {
        var card = cardsToUpdate.pop();
        var x1 = cardOriginX[ card ];
        var x2 = cardOriginX[ card ] + CARD_WIDTH;
        var y1 = cardOriginY[ card ];
        var y2 = cardOriginY[ card ] + CARD_HEIGHT;
        var vertices = [
            vec2( x1, y1 ),
            vec2( x2, y1 ),
            vec2( x1, y2 ),
            vec2( x2, y2 )
        ];
        
        gl.bufferData( gl.ARRAY_BUFFER, flatten( vertices ), gl.STATIC_DRAW );

        var tex = gl.createTexture();
        gl.bindTexture( gl.TEXTURE_2D, tex );
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array( [ 255, 0, 0, 255 ] ) );

        var img = new Image();
        img.src = "img/" + cards[ card ].name + ".png";
        img.onload = function() {
            gl.bindTexture( gl.TEXTURE_2D, tex );
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        };

        //update cards to update
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertices.length );
    }
}
