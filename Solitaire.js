// Author: Jarrett Locke
// Class: Computer Graphics
//
// Assignment: Create a simple game of solitaire using WebGL (AAAARRRRRGGHGHHHH)
//
// Process:
//      - Create gl object
//      - Initialize viewport, clear color, and program.
//      - Initialize vertex buffer and attribute.
//      - Initialize color buffer and attribute.
//      - do things.
//
// It's really sad when I can find more documentation on WebGL from MSDN
//      than the actual developers of WebGL. >:(

var canvas;
var gl;

var vPosition;
var vColor;
var program;
var verticesBuffer;
var verticesColorBuffer;

var drag = false;
var selected = false;

var oldX, oldY;
var deltaX = 0;
var deltaY = 0;

var cardVertices = [];
var cardColors = [];

var CARD_WIDTH = 0.25;
var CARD_HEIGHT = 0.5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl )
    {
        alert( "WebGL is not available." );
        return;
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 1.0, 0.0, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8 * 208, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * 208, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    canvas.addEventListener( "mousedown", mouseDown );

    initCards();

    setInterval( render, 15 );

    function render()
    {
        for ( var i = 0; i < 52; ++i )
        {
            
        }

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 52 );
    }

    function mouseDown( e )
    {
    }

    function mouseMove( e )
    {

    }

    function initCards()
    {
        for ( var i = 0; i < 52; ++i )
        {
            cardVertices.push( vec2( -0.125, 0.25 ) );
        }

        cardColors.push( vec4( 1.0, 0.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 1.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 1.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 0.0, 1.0 ) );
    }
};
