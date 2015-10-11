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

var CARD_WIDTH = 0.2;
var CARD_HEIGHT = 0.5;
var offset = 0.01;

var point1, point2, point3, point4;
var tmp1, tmp;

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
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8 * 312, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * 312, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    canvas.addEventListener( "mousedown", mouseDown );
    canvas.addEventListener( "mouseup", mouseUp );
    canvas.addEventListener( "mousemove", mouseMove );

    initCards();

    setInterval( render, 15 );

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT );
        for ( var i = 0; i < 52; ++i )
        {
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
            tmp1 = [
                cardVertices[ i ],
                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] ),
                vec2( cardVertices[ i ][ 0 ], cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ i ][ 0 ], cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] )
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 48 * i, flatten( tmp1 ) );

            gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
            tmp = [
                cardColors[ 2 ],
                cardColors[ 2 ],
                cardColors[ 2 ],
                cardColors[ 2 ],
                cardColors[ 2 ],
                cardColors[ 2 ]
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 96 * i, flatten( tmp ) );
        }

        gl.drawArrays( gl.TRIANGLES, 0, 312 );
    }

    function mouseDown( e )
    {
        drag = true;
    }

    function mouseUp( e )
    {
        drag = false;
    }

    function mouseMove( e )
    {
        if ( !drag )
        {
            return;
        }

        newX = 2 * e.clientX / canvas.width - 1;
        newY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        cardVertices[ 2 ][ 0 ] = newX - ( CARD_WIDTH / 2 );
        cardVertices[ 2 ][ 1 ] = newY + ( CARD_HEIGHT / 2 );
    }

    function initCards()
    {
        for ( var i = 0; i < 52; ++i )
        {
            cardVertices.push( vec2( -0.125 + ( offset * i ), 0.25 + ( offset * i ) ) );
        }

        cardColors.push( vec4( 1.0, 0.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 1.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 1.0, 1.0 ) );
    }
};
