window.onload = function init()
{
    var canvas;
    var gl;

    var vPosition;
    var vColor;
    var program;

    // Empyt array/matrix that will hold all the cards in the game.
    var cards = new Array( 52 );
    var textures = new Array( 53 );
    var positionsX = new Array( 52 * 4 );
    var positionsY = new Array( 52 * 4 );
    var positionsZ = new Array( 52 * 4 );

    canvas = document.getElementById( "gl-canvas" );

    var gl = initWebGL( canvas );

    if ( gl ) {
        gl.clearColor( 0.165, 0.714, 0.043, 1.0 );
        gl.enable( DEPTH_TEST );
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.viewport( 0, 0, canvas.width, canvas.height );
    }

    initShaders();

    render();

    function render() 
    {
    }

    function initWebGL( canvas ) 
    {
        gl = null;

        gl = canvas.getContext( "webgl" );

        if ( !gl ) 
        {
            alert( "Unable to initialize webgl." );
        }

        return gl;
    }

    function initShaders()
    {
        var vertexShader = getShader( gl, "vertex-shader" );
        var fragmentShader = getShader( gl, "fragment-shader" );

        shaderProgram = gl.createProgram();
        gl.attachShader( shaderProgram, vertexShader );
        gl.attachShader( shaderProgram, fragmentShader );
        gl.linkProgram( shaderProgram );
        
        if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
        {
            alert( "Unable to initialize the shader program." );
        }

        gl.useProgram( shaderProgram );

        vPosition = gl.getAttribLocation( shaderProgram, "vPosition" );
        gl.enableVertexAttribArray( vPosition );
        vColor = gl.getAttribLocation( shaderProgram, "vColor" );
        gl.enableVertexAttribArray( vColor );
        u_resolution = gl.getAttribLocation( shaderProgram, "u_resolution" );
        gl.enableVertexAttribArray( u_resolution );
    }

    function getShader( gl, id )
    {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById( id );

        if ( !shaderScript )
        {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while ( currentChild )
        {
            if ( currentChild.nodeType == currentChild.TEXT_NODE )
            {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        if ( shaderScript.type == "x-shader/x-fragment" )
        {
            shader = gl.createShader( gl.FRAGMENT_SHADER );
        }
        else if ( shaderScript.type == "x-shader/x-vertex" )
        {
            shader = gl.createShader( gl.VERTEX_SHADER );
        }
        else
        {
            return null;
        }

        gl.shaderSource( shader, theSource );

        gl.compileShader( shader );

        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
        {
            alert( "An error occurred while compiling shaders: " + gl.getShaderInfoLog( shader ) );
            return null;
        }

        return shader
    }
};

